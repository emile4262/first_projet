import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCartDto, UpdateCartDto } from './dto/create-cart.dto';
import { SearchCartDto } from './dto/search.cart.dto';

@Injectable()
export class CartService {
    
  constructor(private readonly prisma: PrismaService) {}

//   la création du panier 
  async create(createCartDto: CreateCartDto, userId?: string) {

// verifie que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
       where: { id: userId },
    })

    if (!userId) {
      throw new NotFoundException('L\'ID utilisateur est requis');
    }

    if(!user) {
      throw new NotFoundException(`Utilisateur avec identifiant ${userId} pas trouvé`);
    }

    // Vérifie si un panier actif existe déjà pour l'utilisateur
   const existingActiveCart = await this.prisma.cart.findFirst({
    where: {
      userId: userId,
      status: 'ACTIVE',
    },
  });

  if(existingActiveCart){
    throw new ConflictException(`Un panier actif existe déjà pour l'utilisateur ${userId}`);
  }

    return this.prisma.cart.create({
      data: {
       productId: createCartDto.productId,
        userId: userId,
        status: 'ACTIVE',
        total: 0,
      },
      include: { products: true },
    });
  }

//  recupère tous les paniers

  async findAll(query: SearchCartDto) {
    const { page = 1, limit = 10, search, dateCreationDebut, dateCreationFin } = query || {};
    const take = Math.max(1, Number(limit || 10));
    const skip = (Math.max(1, Number(page || 1)) - 1) * take;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (dateCreationDebut || dateCreationFin) {
      where.createdAt = {};
      if (dateCreationDebut) where.createdAt.gte = new Date(dateCreationDebut);
      if (dateCreationFin) where.createdAt.lte = new Date(dateCreationFin);
    }

    const [data, total] = await Promise.all([
      this.prisma.cart.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.cart.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take),
      },
    };
  } 

//  recupère un panier par son identifiant
     async findOne(id: string) {
          const cart = await this.prisma.cart.findUnique({
      where: { id },
      include: { products: true, user: true },
    });

    if (!cart) {
      throw new NotFoundException(`le panier ${id} non trouvé `);
    }

    return cart;
     }

      // recupère le panier actif d'un utilisateur

      async findByUserId(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { 
        userId,
        status: 'ACTIVE',
      },
      include: { products: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!cart) {
      throw new NotFoundException(`Aucun panier actif trouvé pour l'utilisateur ${userId}`);
    }

  }
  //  verifie si un panier contient un produit
   async hasProduct(cartId: string, productId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { products: true },
          });
              if (!cart) {
                        throw new NotFoundException(`Panier avec identifiant ${cartId} non trouvé`);
    }
      }
      // modifie un panier

        async update(id: string, updateCartDto: UpdateCartDto) {
    const cart = await this.prisma.cart.findUnique({
    where: { id },
    include: { products: true },
    });
    if (!cart) {
    throw new NotFoundException(`Panier avec identifiant ${id} non trouvé`);
     }
    return this.prisma.cart.update({
    where: { id },
    data: updateCartDto,
    include: { products: true },
      });
      }

  // supprimer un panier
  async remove(id: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: id },
    });

    if (!cart) {
      throw new NotFoundException(`Panier avec identifiant ${id} non trouvé`);
    }

    return this.prisma.cart.delete({
      where: { id: id },
    });
  }
  // Mettre à jour le total du panier
    async updateCartTotal(id: string, newTotal: number) {
          const cart = await this.prisma.cart.findUnique({
      where: { id },
    });
    if (!cart) {
      throw new NotFoundException(`Panier avec identifiant ${id} non trouvé`);
    } 
        return this.prisma.cart.update({
      where: { id },
      data: { total: newTotal },
    }); 
      }
        // Obtenir le nombre total d'éléments dans un panier
   async getProductCount(id: string) {
     const cart = await this.prisma.cart.findUnique({
      where: { id },  
      include: { products: true },  
      }); 
         if (!cart) {
       throw new NotFoundException(`Panier avec identifiant ${id} non trouvé`);
         }  
        return cart.products.length;    
       }   
         // Changer le statut du panier
       async changeStatus(id: string, newStatus: string) {
        const cart = await this.prisma.cart.findUnique({
        where: { id },
        include: { products: true }, 
        });
        if (!cart) {
          throw new NotFoundException(`Panier avec identifiant ${id} non trouvé`);
        }
        return this.prisma.cart.update({
          where: { id },
          data: { status: newStatus as any }, 
          include: { products: true },
        });
       }
         // Ajouter un produit au panier

       async addProductToCart(cartId: string, productId: string) {
       const cart = await this.prisma.cart.findUnique({
       where: { id: cartId },
        include: { products: true },
       });
        if (!cart) {
          throw new NotFoundException(`Panier avec identifiant ${cartId} non trouvé`);
        }
        
        // Vérifier que le produit existe
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
        });
        
        if (!product) {
          throw new NotFoundException(`Produit avec identifiant ${productId} non trouvé`);
        }

        // Connecter le produit au panier
        return this.prisma.cart.update({
          where: { id: cartId },
          data: {
            products: {
              connect: { id: productId },
            },
          },
          include: { products: true },
        });
      }
      // Vérifier si le produit existe
      async checkProductExists(productId: string) {
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
        });
        if (!product) {
          throw new NotFoundException(`Produit avec identifiant ${productId} non trouvé`);
        }
        return product;
      }
        }


