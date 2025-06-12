import { IsEnum, IsOptional } from 'class-validator';
import { PayementStatus } from './create-payement.dto';

export class UpdatePayementDto {
  @IsOptional()
  amount?: number;

  @IsOptional()
  @IsEnum(PayementStatus)
  status?: PayementStatus;
}
