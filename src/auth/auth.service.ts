import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationService } from '../notifications/notification.service';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user: any = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(email: string, pass: string) {
    const existing = await this.usersService.findOne(email);
    if (existing) {
        throw new UnauthorizedException('User already exists');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(pass, salt);
    const verificationToken = nanoid(32);

    const newUser = await this.usersService.create({
        email,
        passwordHash,
        verificationToken,
        role: 'user', // Default role
    });

    // Send Verification Email
    const verifyLink = `https://hostmachine.com.au/verify?token=${verificationToken}`;
    this.notificationService.sendEmail(email, 'verify', { link: verifyLink, name: email.split('@')[0] });

    return {
        status: 'success',
        message: 'Account created. Please check your email.',
    };
  }

  async verify(token: string) {
      const user = await this.usersService.findByVerificationToken(token);
      if (!user) {
          throw new UnauthorizedException('Invalid token');
      }
      
      await this.usersService.update(user.id, { 
          isVerified: true, 
          verificationToken: null 
      });

      // Send Welcome Email
      this.notificationService.sendEmail(user.email, 'welcome', { name: user.email.split('@')[0], link: 'https://hostmachine.com.au/login' });

      return { status: 'success', message: 'Email verified' };
  }
}
