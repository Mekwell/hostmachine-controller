import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { InternalGuard } from '../auth/internal.guard';

@Controller('admin')
@UseGuards(InternalGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('system-state')
  async getSystemState() {
    return this.adminService.getSystemState();
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }
}
