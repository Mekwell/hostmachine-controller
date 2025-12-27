import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    NotificationModule,
    JwtModule.registerAsync({
        useFactory: () => {
            if (!process.env.JWT_SECRET) {
                console.warn('WARNING: Using insecure default JWT_SECRET!');
            }
            return {
                secret: process.env.JWT_SECRET || 'secretKey',
                signOptions: { expiresIn: '7d' },
            };
        }
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}