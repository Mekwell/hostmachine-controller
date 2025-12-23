import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsNumber()
  price!: number;

  @IsNumber()
  ramMb!: number;

  @IsNumber()
  cpuCores!: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
