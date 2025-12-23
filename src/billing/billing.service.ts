import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { PlansService } from '../plans/plans.service';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    private plansService: PlansService,
  ) {}

  async subscribe(dto: SubscribeDto) {
    const plan = await this.plansService.findOne(dto.planId);
    if (!plan) throw new NotFoundException('Plan not found');

    const sub = this.subscriptionRepo.create({
      userId: dto.userId,
      plan: plan,
      status: 'ACTIVE'
    });

    await this.subscriptionRepo.save(sub);
    return { status: 'success', subscriptionId: sub.id, message: 'Plan purchased!' };
  }

  async getUserSubscriptions(userId: string) {
    return this.subscriptionRepo.find({
        where: { userId },
        relations: ['plan']
    });
  }
}