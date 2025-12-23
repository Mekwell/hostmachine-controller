import { IsString, IsNotEmpty, IsObject, IsNumber, IsOptional } from 'class-validator';

export class NodeSpecsDto {
  @IsNumber()
  cpuCores!: number;

  @IsNumber()
  totalMemoryMb!: number;

  @IsNumber()
  totalDiskGb!: number;

  @IsString()
  osPlatform!: string;

  @IsString()
  hostname!: string;
}

export class RegisterNodeDto {
  @IsString()
  @IsNotEmpty()
  enrollmentToken!: string;

  @IsObject()
  specs!: NodeSpecsDto;

  @IsString()
  @IsOptional()
  vpnIp?: string;

  @IsString()
  @IsOptional()
  location?: string;
}
