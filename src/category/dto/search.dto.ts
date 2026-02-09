import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'recherche de la classe' })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'Numéro de page', example: 1 })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'limit', example: 10 })
  limit: number = 10;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Date de création - début (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  dateCreationDebut?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Date de création - fin (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  dateCreationFin?: string;
}
