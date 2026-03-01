// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // ✅ make User repository injectable
  ],
  providers: [AuthService],
  controllers: [AuthController], // ✅ add this
  exports: [AuthService],
})
export class AuthModule {}