import { IsEnum, IsString, IsOptional, IsUUID } from 'class-validator';
import { TicketType, TicketStatus } from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsEnum(TicketType)
  type: TicketType;

  @IsString()
  logs: string;

  @IsUUID()
  @IsOptional()
  serverId?: string;

  @IsUUID()
  nodeId: string;

  @IsString()
  @IsOptional()
  aiAnalysis?: string;

  @IsString()
  @IsOptional()
  resolution?: string;

  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;
}
