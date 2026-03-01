import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: true })
  user: User | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column('decimal')
  total: number;

  @Column({ default: 'pending' })
  status: string; // pending, shipped, delivered

  @Column({ nullable: true })
  paymentReference: string;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}