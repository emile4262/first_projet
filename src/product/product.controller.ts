import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Query, Request } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchDto } from 'src/users/dto/search.dto';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/config/jwt-auth/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/config/roles.guard';
import { Role, Roles } from 'src/config/role.decorateur';
import { ExcludeFieldsInterceptor } from 'src/composant/composant.interceptor';
import { SearchProductDto } from './dto/search.product.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('products')
@ApiBearerAuth()
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @ApiOperation({ summary: 'Créer un nouveau produit avec image optionnelle' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nom du produit',
        },
        description: {
          type: 'string',
          description: 'Description du produit',
        },
        price: {
          type: 'number',
          description: 'Prix du produit',
        },
        categoryId: {
          type: 'string',
          description: 'ID de la catégorie',
        },
        stockInitial: {
          type: 'number',
          description: 'Stock initial',
        },
        // userId: {
        //   type: 'string',
        //   description: 'ID de l\'utilisateur',
        // },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image du produit (optionnel)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Produit créé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @Post()
  @Roles(Role.admin)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif)$/)) {
          return callback(new BadRequestException('Seules les images sont autorisées!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 1024 * 1024 * 5,
      },
    }),
  )
  async create(@Body() createProductDto: CreateProductDto, @UploadedFile() file?: Express.Multer.File, @Request() req?: any) {
    let imageUrl: string | undefined;
    if (file) {
      imageUrl = `/uploads/products/${file.filename}`;
    }
    const userId = req?.user?.userId;
    return this.productService.create(createProductDto, imageUrl, userId);
  }

  // @ApiOperation({ summary: "Uploader une image et l'associer à un produit existant" })
  // @ApiConsumes('multipart/form-data')
  // @ApiParam({ name: 'productId', description: 'ID du produit' })
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       file: {
  //         type: 'string',
  //         format: 'binary',
  //         description: 'Image du produit (jpg, jpeg, png, gif)',
  //       },
  //     },
  //   },
  // })
  // @ApiResponse({ status: 200, description: 'Image uploadée avec succès' })
  // @ApiResponse({ status: 400, description: 'Fichier invalide ou manquant' })
  // @Post(':productId/upload-image')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: './uploads/products',
  //       filename: (req, file, callback) => {
  //         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  //         const ext = extname(file.originalname);
  //         callback(null, `product-${uniqueSuffix}${ext}`);
  //       },
  //     }),
  //     fileFilter: (req, file, callback) => {
  //       if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif)$/)) {
  //         return callback(new BadRequestException('Seules les images sont autorisées!'), false);
  //       }
  //       callback(null, true);
  //     },
  //     limits: {
  //       fileSize: 1024 * 1024 * 5,
  //     },
  //   }),
  // )
  // async uploadProductImage(
  //   @Param('productId') productId: string,
  //   @UploadedFile() file: Express.Multer.File
  // ) {
  //   if (!file) {
  //     throw new BadRequestException('Fichier non fourni');
  //   }

  //   const imageUrl = `/uploads/products/${file.filename}`;

  //   await this.productService.updateProductImage(productId, imageUrl);

  //   return {
  //     url: imageUrl,
  //     filename: file.filename,
  //     productId: productId
  //   };
  // }

  @ApiOperation({ summary: 'Récupérer tous les produits' })
  @ApiResponse({ status: 200, description: 'Produits récupérés avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @UseInterceptors(new ExcludeFieldsInterceptor(['stockInitial']))
  findAll(@Query() query: SearchProductDto) {
    return this.productService.findAll(query);
  }

  // @ApiOperation({ summary: 'Récupérer tous les produits avec leurs catégories' })
  // @ApiResponse({ status: 200, description: 'Produits récupérés avec succès' })
  // @ApiResponse({ status: 401, description: 'Non autorisé' })
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @Get('with-category')
  // findAllWithCategory() {
  //   return this.productService.findAllWithCategory();
  // }

  // @ApiOperation({ summary: 'Rechercher les products' })
  // @ApiParam({ name: 'recherche', description: 'rechercher un product' })
  // @ApiResponse({ status: 200, description: 'Produit récupéré avec succès' })
  // @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  // @ApiResponse({ status: 401, description: 'Non autorisé' })
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @Get('search')
  // @Roles(Role.admin)
  // async search(@Query('search') search: string) {
  //   return this.productService.searchProducts(search);
  // }

  @ApiOperation({ summary: 'Récupérer un produit par son ID' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({ status: 200, description: 'Produit récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @Roles(Role.admin)
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @ApiOperation({ summary: 'Supprimer un produit par son ID' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({ status: 200, description: 'Produit supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @Roles(Role.admin)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}