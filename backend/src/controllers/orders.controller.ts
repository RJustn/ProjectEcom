import { Controller, Get, Post, Patch, Param, Body, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order.item-entity';
import { Product } from '../products/product.entity';

type UpdateOrderStatusInput = {
  status: string;
};

@Controller('users/orders')
export class OrdersController {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  @Get('all')
  async getAllOrders() {
    const orders = await this.orderRepo.find({ order: { createdAt: 'DESC' } });

    const ordersWithItems = await Promise.all(
      orders.map(async (o) => {
        const items = await this.orderItemRepo.find({ where: { order: { id: o.id } }, relations: ['product'] });
        return { ...o, items };
      }),
    );

    return { data: ordersWithItems };
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    const orderId = Number(id);
    const order = await this.orderRepo.findOne({ where: { id: orderId } as any });
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const items = await this.orderItemRepo.find({
      where: { order: { id: orderId } } as any,
      relations: ['product'],
    });

    return { ...order, items };
  }

  @Post(':id/confirm-paid')
  async confirmOrderPaid(@Param('id') id: string) {
    const orderId = Number(id);
    const order = await this.orderRepo.findOne({ where: { id: orderId } as any });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === 'paid') {
      return { ok: true, orderId: order.id, status: order.status };
    }

    const orderItems = await this.orderItemRepo.find({
      where: { order: { id: order.id } } as any,
      relations: ['product'],
    });

    for (const item of orderItems) {
      const product = await this.productRepo.findOne({ where: { id: item.product.id } });
      if (!product) continue;

      const nextStock = Math.max(0, Number(product.stock) - Number(item.quantity));
      const nextSold = Number(product.sold || 0) + Number(item.quantity);

      await this.productRepo.update(product.id, {
        stock: nextStock,
        sold: nextSold,
      });
    }

    order.status = 'paid';
    order.paidAt = new Date();
    await this.orderRepo.save(order);

    return { ok: true, orderId: order.id, status: order.status };
  }

  @Post(':id/request-cancel')
  async requestCancelOrder(@Param('id') id: string) {
    const orderId = Number(id);
    const order = await this.orderRepo.findOne({ where: { id: orderId } as any });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === 'cancelled' || order.status === 'cancel_requested') {
      return { ok: true, orderId: order.id, message: 'Order cancellation already requested or cancelled' };
    }

    order.status = 'cancel_requested';
    await this.orderRepo.save(order);

    return { ok: true, orderId: order.id, message: 'Cancellation request sent to admin' };
  }

  @Patch(':id/cancel')
  async cancelOrder(@Param('id') id: string) {
    const orderId = Number(id);
    const order = await this.orderRepo.findOne({ where: { id: orderId } as any });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === 'cancelled' || order.status === 'refunded') {
      return { ok: true, orderId: order.id, message: 'Order already cancelled or refunded' };
    }

    // Get order items to restore stock
    const orderItems = await this.orderItemRepo.find({
      where: { order: { id: order.id } } as any,
      relations: ['product'],
    });

    // Restore stock for each item
    for (const item of orderItems) {
      const product = await this.productRepo.findOne({ where: { id: item.product.id } });
      if (!product) continue;

      const restoredStock = Number(product.stock) + Number(item.quantity);
      const restoredSold = Math.max(0, Number(product.sold || 0) - Number(item.quantity));

      await this.productRepo.update(product.id, {
        stock: restoredStock,
        sold: restoredSold,
      });
    }

    // Attempt refund if order was paid
    let refundSuccessful = false;
    if (order.status === 'paid' && order.paymentReference) {
      try {
        const secretKey = process.env.PAYMONGO_SECRET_KEY;
        if (!secretKey) {
          throw new Error('PAYMONGO_SECRET_KEY is not configured');
        }

        const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');

        const refundPayload = {
          data: {
            attributes: {
              notes: `Refund for cancelled order #${orderId}`,
            },
          },
        };

        const refundRes = await fetch(
          `https://api.paymongo.com/v1/payments/${order.paymentReference}/refunds`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${basicAuth}`,
            },
            body: JSON.stringify(refundPayload),
          },
        );

        const refundData: any = await refundRes.json();
        if (refundRes.ok) {
          refundSuccessful = true;
        } else {
          console.warn('Refund warning:', refundData?.errors?.[0]?.detail);
        }
      } catch (e: any) {
        console.warn('Refund processing error:', e?.message);
      }
    }

    // Mark order as refunded if payment was refunded, otherwise cancelled
    order.status = (order.status === 'paid' && refundSuccessful) ? 'refunded' : 'cancelled';
    await this.orderRepo.save(order);

    return {
      ok: true,
      orderId: order.id,
      status: order.status,
      message: order.status === 'refunded' 
        ? 'Order cancelled and payment refunded successfully' 
        : 'Order cancelled (payment refund may be pending)',
      refunded: refundSuccessful,
    };
  }

  @Patch(':id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusInput) {
    const orderId = Number(id);
    const order = await this.orderRepo.findOne({ where: { id: orderId } as any });
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = body.status;
    await this.orderRepo.save(order);

    return { ok: true, orderId: order.id, status: order.status };
  }
}
