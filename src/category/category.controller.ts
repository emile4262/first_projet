import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
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

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('category')
@ApiBearerAuth()
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles(Role.admin)
  @ApiBearerAuth()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @ApiOperation({summary: 'Récupérer tous les catégories'})
  @ApiResponse({ status: 200, description: 'Catégories récupérés avec succès' })
  @Get()
  @Roles(Role.admin)
  @ApiBearerAuth()
  findAll(@Query() query: SearchDto) {
    return this.categoryService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.admin)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.admin)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles(Role.admin)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
  }



