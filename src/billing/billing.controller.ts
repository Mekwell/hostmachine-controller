import { Body, Controller, Get, Param, Post, ValidationPipe, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { InternalGuard } from '../auth/internal.guard';

@Controller('billing')
@UseGuards(InternalGuard) // <--- LOCKED DOWN
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('subscribe')
  subscribe(@Body(new ValidationPipe()) dto: SubscribeDto) {
    return this.billingService.subscribe(dto);
  }

  @Get('subscriptions/:userId')
  getUserSubscriptions(@Param('userId') userId: string) {
    return this.billingService.getUserSubscriptions(userId);
  }
}