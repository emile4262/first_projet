import { Controller, Post, Body, Get,Param,Patch,Delete,UseGuards,Req, BadRequestException, UnauthorizedException,} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-reviews.dto';
import { UpdateReviewDto } from './dto/update-reviews.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { Role, Roles } from 'src/auth/role.decorateur';
import { RolesGuard } from 'src/auth/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Review } from '@prisma/client';


@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewController {
  prisma: any;
  constructor(private readonly reviewService: ReviewService) {}
   
  @ApiBearerAuth()
  @Post()
  @Roles(Role.admin)
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(createReviewDto);
  }

  // obtenir tous les avis
   
@ApiBearerAuth()
@Get()
@Roles(Role.admin)
async getAllReview() {
  return await this.reviewService.findAll();
}

   
  @ApiBearerAuth()
  @Get('id')
  @Roles(Role.admin)
   async findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }
   
  @ApiBearerAuth()
  @Patch(':id')
  @Roles(Role.admin)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @Req() req,
  ) {
    return this.reviewService.update(req.user.sub, id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @Roles(Role.admin)
  remove(@Param('id') id: string, @Req() req) {
    return this.reviewService.remove(req.user.sub, id);
  }
}
