import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateCartStatusDto {
  @ApiProperty({
    description: 'Nouveau statut du panier',
    example: 'validé',
    enum: ['en_attente', 'validé', 'payé', 'annulé'],
  })
  @IsString()
  @IsIn(['en_attente', 'validé', 'payé', 'annulé'], {
    message: 'Le statut doit être une des valeurs suivantes : en_attente, validé, payé, annulé',
  })
  status: string;
}
