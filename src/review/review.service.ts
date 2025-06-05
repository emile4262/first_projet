import {Injectable,ForbiddenException,NotFoundException,  BadRequestException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateReviewDto } from './dto/create-reviews.dto';
import { UpdateReviewDto } from './dto/update-reviews.dto';
import { Review } from './entities/reviews.entity';

@Injectable()
export class ReviewService {
  getAllReview() {
    throw new Error('Method not implemented.');
  }
  findUnique(reviewId: string) {
    throw new Error('Method not implemented.');
  }
  findAllByReview(reviewId: string) {
    throw new Error('Method not implemented.');
  }
  constructor(private readonly prisma: PrismaService) {}

  
  // Créer un avis
  async create(data: CreateReviewDto): Promise<Review> {
    // Vérifie si l'utilisateur a acheté ce produit
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundException("Vous ne pouvez pas noter ce produit car vous ne l'avez jamais acheté.");
    }

    // Vérifie si le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new BadRequestException('Le produit spécifié est introuvable.');
    }

    // Vérifie si l'utilisateur a déjà noté ce produit

    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId: data.userId,
        productId: data.productId,
      },
    });
    if (existingReview) {
      throw new BadRequestException('Vous avez déjà noté ce produit.');
    }

    // Vérifie si la note est valide
    if (data.rating < 1 || data.rating > 10) {
      throw new BadRequestException('La note doit être comprise entre 1 et 10.');
    }

    // Créer un nouvel avis
    const review = await this.prisma.review.create({
      data: {
        rating: data.rating,
        comment: data.comment,
        productId: data.productId,
        userId: data.userId,
      },
    });

    return review;
    
  }
  // obtient tous les avis

  async findAll() {
    return this.prisma.review.findMany();
  }

  // obtenir un avis par son id
  async findOne( id: string ) {
    // Vérifie si l'avis existe

    if (!id) {
      throw new NotFoundException("L'avis avec cet ID n'existe pas");
    }
    // Récupérer l'avis par son ID
  const review = await this.prisma.review.findUnique({
      where:{id: id},
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        userId: true,
        productId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
      },
    })
    
    if (!review) {
      throw new NotFoundException("l'avis avec cet ID ${id} n'existe pas");
    }
    return review;
  }
     
          
  


  // Récupérer un avis par son ID
  async update(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) throw new NotFoundException('Avis non trouvé');

    if (review.userId !== userId) {
      throw new ForbiddenException("Vous ne pouvez modifier que vos avis");
    }

    return this.prisma.review.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) throw new NotFoundException('Avis non trouvé');

    if (review.userId !== userId) {
      throw new ForbiddenException("Vous ne pouvez supprimer que vos avis");
    }

    return this.prisma.review.delete({ where: { id } });
  }
 }
