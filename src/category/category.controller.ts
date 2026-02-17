import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { AuthGuard} from '@nestjs/passport';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from 'src/config/public.decorateur';
import { JwtAuthGuard } from 'src/config/jwt-auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/config/role.decorateur';
import { Role } from 'src/config/role.decorateur';
import { RolesGuard } from 'src/config/roles.guard';
import { SearchDto } from 'src/users/dto/search.dto';
import { Request } from 'express';

type RequestWithUser = Request & { user?: { userId?: string } };

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('category')
@ApiBearerAuth()
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({summary: 'Créer une nouvelle catégorie'})
  @ApiResponse({ status: 201, description: 'Catégorie créée avec succès' })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @ApiBearerAuth()
  create(@Body() createCategoryDto: CreateCategoryDto, @Req() req?: RequestWithUser) {
   const userId = req?.user?.userId;
    return this.categoryService.create(createCategoryDto, userId);
  }

  @ApiOperation({summary: 'Récupérer tous les catégories'})
  @ApiResponse({ status: 200, description: 'Catégories récupérés avec succès' })
  @Get()
  @ApiBearerAuth()
  findAll(@Query() query: SearchDto) {
    return this.categoryService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
  }



