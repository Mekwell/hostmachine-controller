import { Body, Controller, Get, Param, Post, Headers, UseGuards } from '@nestjs/common';
import { CommandsService } from './commands.service';
import { CreateCommandDto } from './dto/create-command.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { InternalGuard } from '../auth/internal.guard';

@Controller('commands')
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  // --- API for Website (Admin) ---
  @Post()
  @UseGuards(InternalGuard)
  create(@Body() createCommandDto: CreateCommandDto) {
    return this.commandsService.create(createCommandDto);
  }

  // --- API for Agents (Protected by API Key) ---
  @Get('poll')
  @UseGuards(ApiKeyGuard)
  poll(@Headers('x-node-id') nodeId: string) {
    // Guard ensures nodeId/apiKey are valid before we get here
    const command = this.commandsService.getNextPendingCommand(nodeId);
    if (!command) return { hasCommand: false };
    
    return { hasCommand: true, command };
  }

  @Post(':id/complete')
  @UseGuards(ApiKeyGuard)
  complete(
      @Param('id') id: string, 
      @Body() result: { success: boolean, data?: any }
  ) {
    return this.commandsService.complete(id, result.success, result.data);
  }

  @Post('exec/:serverId')
  @UseGuards(InternalGuard)
  execCommand(@Param('serverId') serverId: string, @Body('command') command: string) {
    return this.commandsService.executeCommand(serverId, command);
  }
}