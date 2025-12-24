import { IsString, IsUUID, IsOptional, IsObject } from 'class-validator';

export class ReportIssueDto {
  @IsUUID()
  @IsOptional()
  containerId?: string; // Docker ID

  @IsString()
  containerName: string; // e.g. "server-uuid"

  @IsString()
  logs: string; // Last 50 lines

  @IsString()
  @IsOptional()
  exitCode?: string;
}
