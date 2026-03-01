import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
    ) {}

    async login(body: { email: string; password: string }) {
        const user = await this.userRepo.findOne({ where: { email: body.email } });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (body.password !== user.password) {
            throw new UnauthorizedException('Invalid password');
        }

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isAdmin: user.isAdmin,
            },
        };
    }
}