import { Controller, Get, Post, Param, Body, NotFoundException, BadRequestException, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order.item-entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';

type CheckoutItemInput = {
  productId: number;
  quantity: number;
};

type CreateCheckoutInput = {
  email: string;
  items: CheckoutItemInput[];
  successUrl?: string;
  cancelUrl?: string;
};

@Controller('users/checkout')
export class CheckoutController {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  @Post('paymongo')
  async createPaymongoCheckout(@Body() body: CreateCheckoutInput) {
    const { email, items, successUrl, cancelUrl } = body;

    if (!email) throw new BadRequestException('email is required');
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('items are required');
    }

    const user = await this.userRepo.findOne({ where: { email } });

    const normalizedItems = items.map((item) => ({
      productId: Number(item.productId),
      quantity: Math.max(1, Number(item.quantity || 1)),
    }));

    const productIds = normalizedItems.map((item) => item.productId);
    const products = await this.productRepo.findBy({ id: In(productIds) });
    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products were not found');
    }

    const productById = new Map(products.map((product) => [product.id, product]));

    for (const item of normalizedItems) {
      const product = productById.get(item.productId);
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      if (item.quantity > product.stock) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }
    }

    const total = normalizedItems.reduce((sum, item) => {
      const product = productById.get(item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        user: user || null,
        email,
        total,
        status: 'pending',
      }),
    );

    const orderItems = normalizedItems.map((item) => {
      const product = productById.get(item.productId)!;
      return this.orderItemRepo.create({
        order,
        product,
        quantity: item.quantity,
        price: Number(product.price),
      });
    });
    await this.orderItemRepo.save(orderItems);

    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      throw new BadRequestException('PAYMONGO_SECRET_KEY is not configured');
    }

    const frontendBaseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

    const payload = {
      data: {
        attributes: {
          line_items: normalizedItems.map((item) => {
            const product = productById.get(item.productId)!;
            return {
              currency: 'PHP',
              amount: Math.round(Number(product.price) * 100),
              name: product.name,
              quantity: item.quantity,
            };
          }),
          payment_method_types: ['gcash', 'paymaya', 'card'],
          success_url:
            successUrl ||
            `${frontendBaseUrl}/checkout/success?orderId=${order.id}`,
          cancel_url: cancelUrl || `${frontendBaseUrl}/checkout`,
          metadata: {
            orderId: String(order.id),
            email,
          },
        },
      },
    };

    const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');

    const paymongoRes = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(payload),
    });

    const paymongoData: any = await paymongoRes.json();

    if (!paymongoRes.ok) {
      throw new BadRequestException(paymongoData?.errors?.[0]?.detail || 'Failed to create PayMongo checkout session');
    }

    const checkoutSessionId = paymongoData?.data?.id;
    const checkoutUrl = paymongoData?.data?.attributes?.checkout_url;

    await this.orderRepo.update(order.id, { paymentReference: checkoutSessionId });

    return {
      orderId: order.id,
      checkoutSessionId,
      checkoutUrl,
    };
  }
}

@Controller('users/payments')
export class PaymentsController {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  @Get()
  async getAllPayments() {
    const orders = await this.orderRepo.find({
      where: { paymentReference: Not(IsNull()) },
      order: { createdAt: 'DESC' },
    });

    const paymentsWithItems = await Promise.all(
      orders.map(async (o) => {
        const items = await this.orderItemRepo.find({
          where: { order: { id: o.id } } as any,
          relations: ['product'],
        });
        return { ...o, items };
      }),
    );

    return { data: paymentsWithItems };
  }

  @Post(':id/verify')
  async verifyPayment(@Param('id') id: string) {
    const orderId = Number(id);
    const order = await this.orderRepo.findOne({ where: { id: orderId } as any });
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.paymentReference) {
      throw new BadRequestException('No payment reference found for this order');
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      throw new BadRequestException('PAYMONGO_SECRET_KEY is not configured');
    }

    try {
      const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');

      // Step 1: Fetch the checkout session to get the payment ID
      const sessionRes = await fetch(
        `https://api.paymongo.com/v1/checkout_sessions/${order.paymentReference}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${basicAuth}`,
          },
        },
      );

      const sessionData: any = await sessionRes.json();

      if (!sessionRes.ok) {
        throw new Error(sessionData?.errors?.[0]?.detail || 'Failed to fetch checkout session from PayMongo');
      }

      // Check the session status
      const sessionStatus = sessionData?.data?.attributes?.status;
      const payments = sessionData?.data?.relationships?.payments?.data || [];

      // Extract payment ID from the checkout session - it's in relationships
      const paymentId = payments?.[0]?.id;
      
      if (!paymentId) {
        // If order is marked as paid but session has no payment, it's a mismatch
        const mismatchMsg = order.status === 'paid' 
          ? `Order is marked as PAID but no payment found in PayMongo. ` +
            `This may indicate the payment wasn't actually completed, or the order status was manually changed. ` +
            `Please verify with the customer that they completed the PayMongo payment.`
          : `Payment not found. Session status: ${sessionStatus}. ` +
            `The customer may not have completed payment yet, or the payment is still being processed. ` +
            `Please wait a moment and try again.`;
        
        throw new BadRequestException(mismatchMsg);
      }

      // Step 2: Fetch the actual payment using the payment ID
      const paymentRes = await fetch(
        `https://api.paymongo.com/v1/payments/${paymentId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${basicAuth}`,
          },
        },
      );

      const paymentData: any = await paymentRes.json();

      if (!paymentRes.ok) {
        throw new Error(paymentData?.errors?.[0]?.detail || 'Failed to verify payment with PayMongo');
      }

      const paymentStatus = paymentData?.data?.attributes?.status;
      const paymentAmount = paymentData?.data?.attributes?.amount;

      // Verify the payment status
      if (paymentStatus !== 'paid' && paymentStatus !== 'succeeded') {
        throw new BadRequestException(
          `Payment status is ${paymentStatus}, not paid. Payment appears to be declined or pending. ` +
          `Please ask the customer to complete or retry their payment.`
        );
      }

      // Verify the amount matches (convert from centavos to PHP)
      const expectedAmount = Math.round(Number(order.total) * 100);
      if (paymentAmount !== expectedAmount) {
        throw new BadRequestException(
          `Payment amount mismatch. Expected ₱${parseFloat(order.total as any).toFixed(2)}, but PayMongo shows ₱${(paymentAmount / 100).toFixed(2)}`
        );
      }

      // Mark order as verified
      order.status = 'verified';
      await this.orderRepo.save(order);

      return {
        ok: true,
        orderId: order.id,
        message: 'Payment verified successfully with PayMongo',
        paymentStatus,
        amount: paymentAmount / 100,
      };
    } catch (e: any) {
      throw new BadRequestException(
        e?.message || 'Failed to verify payment with PayMongo'
      );
    }
  }

  @Post(':id/refund')
  async refundPayment(@Param('id') id: string, @Body() body: any) {
    const orderId = Number(id);
    const order = await this.orderRepo.findOne({ where: { id: orderId } as any });
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.paymentReference) {
      throw new BadRequestException('No payment reference found for this order');
    }

    if (order.status === 'refunded' || order.status === 'cancelled') {
      throw new BadRequestException('Order is already refunded or cancelled');
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      throw new BadRequestException('PAYMONGO_SECRET_KEY is not configured');
    }

    try {
      const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');

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

      // Process refund with PayMongo
      const refundPayload = {
        data: {
          attributes: {
            notes: body?.reason || 'Customer requested refund',
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

      if (!refundRes.ok) {
        throw new Error(refundData?.errors?.[0]?.detail || 'Failed to process refund with PayMongo');
      }

      // Mark order as refunded
      order.status = 'refunded';
      await this.orderRepo.save(order);

      return {
        ok: true,
        orderId: order.id,
        status: 'refunded',
        refundId: refundData?.data?.id,
        message: 'Payment refunded successfully. Stock has been restored.',
        amount: parseFloat(order.total as any),
      };
    } catch (e: any) {
      throw new BadRequestException(
        e?.message || 'Failed to process refund with PayMongo'
      );
    }
  }
}
