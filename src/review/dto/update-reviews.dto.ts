import { IsString, IsInt, IsOptional, Length, Min, Max } from 'class-validator';

export class UpdateReviewDto {
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  rating?: number;

  @IsString()
  @Length(10, 500)
  @IsOptional()
  comment?: string;
}
