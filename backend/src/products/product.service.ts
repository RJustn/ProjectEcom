import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { OrderItem } from '../orders/order.item-entity';

type SalesPeriod = 'weekly' | 'monthly';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
  ) {}

  async findAll() {
    const products = await this.productRepo.find();
    const soldMap = await this.getSoldMap();

    return products.map((product) => ({
      ...product,
      sold: soldMap.get(product.id) ?? 0,
    }));
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) return null;

    const sold = await this.getSoldByProductId(id);
    return {
      ...product,
      sold,
    };
  }

  create(data: Partial<Product>) {
    const product = this.productRepo.create(data);
    return this.productRepo.save(product);
  }

  async update(id: number, data: Partial<Product>) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    Object.assign(product, data);
    return this.productRepo.save(product);
  }

  async remove(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.productRepo.remove(product);
  }

  async getSalesSummary(period: SalesPeriod) {
    const now = new Date();
    const since = new Date(now);

    if (period === 'weekly') {
      since.setDate(now.getDate() - 7);
    } else {
      since.setDate(now.getDate() - 30);
    }

    const rows = await this.orderItemRepo
      .createQueryBuilder('oi')
      .leftJoin('oi.order', 'o')
      .leftJoin('oi.product', 'p')
      .select('p.id', 'productId')
      .addSelect('p.name', 'name')
      .addSelect('COALESCE(SUM(oi.quantity), 0)', 'sold')
      .addSelect('COALESCE(SUM(oi.quantity * oi.price), 0)', 'revenue')
      .where('o.createdAt >= :since', { since })
      .andWhere('o.status = :paid', { paid: 'paid' })
      .groupBy('p.id')
      .addGroupBy('p.name')
      .orderBy('sold', 'DESC')
      .getRawMany();

    return {
      period,
      from: since,
      to: now,
      items: rows.map((row) => ({
        productId: Number(row.productId),
        name: row.name,
        sold: Number(row.sold),
        revenue: Number(row.revenue),
      })),
    };
  }

  private async getSoldMap(since?: Date) {
    const query = this.orderItemRepo
      .createQueryBuilder('oi')
      .leftJoin('oi.order', 'o')
      .leftJoin('oi.product', 'p')
      .select('p.id', 'productId')
      .addSelect('COALESCE(SUM(oi.quantity), 0)', 'sold')
      .where('o.status = :paid', { paid: 'paid' })
      .groupBy('p.id');

    if (since) {
      query.andWhere('o.createdAt >= :since', { since });
    }

    const rows = await query.getRawMany();
    const map = new Map<number, number>();

    rows.forEach((row) => {
      map.set(Number(row.productId), Number(row.sold));
    });

    return map;
  }

  private async getSoldByProductId(productId: number, since?: Date) {
    const query = this.orderItemRepo
      .createQueryBuilder('oi')
      .leftJoin('oi.order', 'o')
      .leftJoin('oi.product', 'p')
      .select('COALESCE(SUM(oi.quantity), 0)', 'sold')
      .where('p.id = :productId', { productId })
      .andWhere('o.status = :paid', { paid: 'paid' });

    if (since) {
      query.andWhere('o.createdAt >= :since', { since });
    }

    const row = await query.getRawOne();
    return Number(row?.sold ?? 0);
  }
}