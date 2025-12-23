import { Body, Controller, Delete, Get, Param, Post, ValidationPipe, UseGuards, Headers } from '@nestjs/common';
import { NodesService } from './nodes.service';
import { RegisterNodeDto } from './dto/register-node.dto';
import { InternalGuard } from '../auth/internal.guard';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('nodes')
export class NodesController {
  private cache: any[] | null = null;
  private lastCacheTime = 0;

  constructor(private readonly nodesService: NodesService) {}

  @Post('register')
  register(@Body(new ValidationPipe()) registerDto: RegisterNodeDto) {
    this.cache = null; // Invalidate cache on new registration
    return this.nodesService.register(registerDto);
  }

  @Post('heartbeat')
  @UseGuards(ApiKeyGuard)
  heartbeat(@Headers('x-node-id') nodeId: string, @Body('usage') usage: any) {
    return this.nodesService.updateUsage(nodeId, usage);
  }

  @Get()
  @UseGuards(InternalGuard)
  async findAll() {
    // Cache for 10 seconds to keep deployment wizard fast
    if (this.cache && (Date.now() - this.lastCacheTime < 10000)) {
        return this.cache;
    }
    this.cache = await this.nodesService.findAll();
    this.lastCacheTime = Date.now();
    return this.cache;
  }

  @Get('enrollment-command')
  @UseGuards(InternalGuard)
  getEnrollmentCommand() {
    return { command: this.nodesService.getEnrollmentCommand() };
  }

  @Post(':id/reboot')
  @UseGuards(InternalGuard)
  reboot(@Param('id') id: string) {
      return { status: 'reboot_queued', message: `Reboot command sent to node ${id}` };
  }

  @Delete(':id')
  @UseGuards(InternalGuard)
  remove(@Param('id') id: string) {
    this.cache = null; // Invalidate cache on removal
    return this.nodesService.remove(id);
  }
}
