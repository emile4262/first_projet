import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateOrderDto {
[x: string]: any;
 
 
@ApiProperty()
@IsEmail()
 @IsNotEmpty()    
productId : string ;

@ApiProperty()
@IsEmail()
@IsNotEmpty()
quantity : number ;

@ApiProperty()
@IsNotEmpty()
is_available?: boolean;




// @ApiProperty()
// @IsEmail()
// @IsNotEmpty()
// userId : string ;

// @ApiProperty()
// @IsNotEmpty()
// statuts?: string;

// @ApiProperty()
// @IsString()
// reason: string;


}

