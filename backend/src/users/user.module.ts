import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from '../controllers/users.controller';
import { OrdersController } from '../controllers/orders.controller';
import { CheckoutController, PaymentsController } from '../controllers/payments.controller';
import { User } from './user.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order.item-entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order, OrderItem, Product])],
  controllers: [UsersController, OrdersController, CheckoutController, PaymentsController],
})
export class UsersModule {}