import { ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {

  @ApiProperty()  
  @IsNotEmpty()
  productId: string;
   
  // @ApiProperty()  
  // @IsNotEmpty()
  // orderId: string;

  @ApiProperty()  
  @IsNotEmpty()
  userId: string;


  @ApiProperty()  
  @IsString() 
  @IsInt()
 @Min(1, { message: 'La note doit être d\'au moins 1.' })
  @Max(10, { message: 'La note ne peut pas dépasser 10.' })
  rating: number;


  @ApiProperty()   
  @IsString()
  comment: string;

}
