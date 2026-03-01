import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EntityModule } from './entity.module';
import { UsersModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './products/product.module';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for database connection.');
}

const useSsl = process.env.DB_SSL !== 'false';


@Module({
  
  imports: [
 ConfigModule.forRoot({ isGlobal: true }),
      TypeOrmModule.forRoot({
      type: 'postgres',
      url: databaseUrl,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      autoLoadEntities: true,
      synchronize: true,
    }),
    EntityModule,UsersModule, AuthModule, ProductModule
  ],
  controllers: [AppController],
  providers: [AppService],

  
})
export class AppModule {}
