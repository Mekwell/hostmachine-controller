import { IsString, IsUUID } from 'class-validator';

export class SubscribeDto {
  @IsString()
  userId!: string;

  @IsUUID()
  planId!: string;
}
