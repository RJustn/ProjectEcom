// backend/src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { Product } from './products/product.entity';
import { Order } from './orders/order.entity';
import { OrderItem } from './orders/order.item-entity';
@Module({
  imports: [TypeOrmModule.forFeature([User,Product,OrderItem,Order])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class EntityModule {}