import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Res, HttpStatus, Query} from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags,} from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role, Roles } from 'src/auth/role.decorateur';


@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('products')
@ApiBearerAuth()
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiOperation({ summary: "Uploader une image et l'associer à un produit" })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image du produit (jpg, jpeg, png, gif)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image uploadée avec succès' })
  @ApiResponse({ status: 400, description: 'Fichier invalide ou manquant' })
  @Post(':productId/upload-image')
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
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new BadRequestException('Seules les images sont autorisées!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 1024 * 1024 * 5, 
      },
    }),
  )
  async uploadProductImage(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('Fichier non fourni');
    }
    
    const imageUrl = `/uploads/products/${file.filename}`;
    
    await this.productService.updateProductImage(productId, imageUrl);
    
    return {
      url: imageUrl,
      filename: file.filename,
      productId: productId
    };
  }
  
  @ApiOperation({ summary: 'Créer un nouveau produit' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Produit créé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @Post()
  @Roles(Role.admin)
  @ApiBearerAuth()
  create(@Body() createProductDto: CreateProductDto) {
  return this.productService.create(createProductDto);
  }

   @Get()
findAll() {
  return this.productService.findAll(); // retourne juste les produits
}

@Get('with-category')
findAllWithCategory() {
  return this.productService.findAllWithCategory(); 
}


  // Route: GET /products/search?search=xxx
   @ApiOperation({ summary: 'Rechercher les products' })
  @ApiParam({ name: 'recherche', description: 'rechercher un product' })
  @ApiResponse({ status: 200, description: 'Produit récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('search')
  @Roles(Role.admin)
  async search(@Query('search') search: string) {
    return this.productService.searchProducts(search);
  }

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