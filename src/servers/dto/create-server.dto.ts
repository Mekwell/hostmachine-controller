import { IsString, IsInt, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateServerDto {
  @IsString()
  userId: string;

  @IsString()
  gameType: string;

  @IsInt()
  memoryLimitMb: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  customImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  env?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mods?: string[];

  @IsOptional()
  @IsBoolean()
  autoUpdate?: boolean;

  @IsOptional()
  @IsString()
  restartSchedule?: string;
}