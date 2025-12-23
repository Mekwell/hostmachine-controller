import { Body, Controller, Delete, Get, Param, Post, ValidationPipe, UseGuards } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { InternalGuard } from '../auth/internal.guard';

@Controller('plans')
@UseGuards(InternalGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  create(@Body(new ValidationPipe()) createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Get()
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}