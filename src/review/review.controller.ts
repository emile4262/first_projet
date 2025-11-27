import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, Req, BadRequestException, UnauthorizedException, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-reviews.dto';
import { UpdateReviewDto } from './dto/update-reviews.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { Role, Roles } from 'src/auth/role.decorateur';
import { RolesGuard } from 'src/auth/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Review } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) { }

  @ApiOperation({ summary: 'Créer un avis' })
  @Post()
  @Roles(Role.admin)
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(createReviewDto);
  }

  // obtenir tous les avis
  @ApiOperation({ summary: 'Obtenir tous les avis' })
  @Get()
  @Roles(Role.admin)
  async getAllReview() {
    return await this.reviewService.findAll();
  }

  @ApiOperation({ summary: 'Obtenir un avis par ID' })
  @Get(':id')
  @Roles(Role.admin)
  async findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  @ApiOperation({ summary: 'Mettre à jour un avis' })
  @Patch(':id')
  @Roles(Role.admin)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @Req() req,
  ) {
    return this.reviewService.update(req.user.sub, id, dto);
  }

  @ApiOperation({ summary: 'Supprimer un avis' })
  @Delete(':id')
  @Roles(Role.admin)
  remove(@Param('id') id: string, @Req() req) {
    return this.reviewService.remove(req.user.sub, id);
  }
}
