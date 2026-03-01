import { Body, Controller, Get, Query, Delete, Param, Post, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order.item-entity';
import { clerkClient } from '@clerk/nextjs/server';

@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
  ) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  @Get('clerk')
  async findClerkUsers() {
    // return first 100 clerk users
    const client = await clerkClient();
    const users = await client.users.getUserList({ limit: 100 });
    return users;
  }

  @Get('orders')
  async getOrdersByEmail(@Query('email') email: string) {
    if (!email) return { data: [] };

    const orders = await this.orderRepo.find({ where: { email } });

    const ordersWithItems = await Promise.all(
      orders.map(async (o) => {
        const items = await this.orderItemRepo.find({ where: { order: { id: o.id } }, relations: ['product'] });
        return { ...o, items };
      }),
    );

    return { data: ordersWithItems };
  }

  @Delete('clerk/:id')
  async deleteClerkUser(@Param('id') id: string) {
    const client = await clerkClient();
    await client.users.deleteUser(id);
    return { ok: true };
  }
}