import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CartService {
  [x: string]: any;
  constructor(private readonly prisma: PrismaService) {}

  /** -------------------- CRÉATION -------------------- */
  async create(createCartDto: CreateCartDto) {

// verifie que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
       where: { id: createCartDto.userId },
    })

    if(!user) {
      throw new NotFoundException(`Utilisateur avec identifiant ${createCartDto.userId} pas trouvé`);
    }

    // Vérifie si un panier actif existe déjà pour l'utilisateur
   const existingActiveCart = await this.prisma.cart.findFirst({
    where: {
      userId: createCartDto.userId,
      status: 'ACTIVE',
    },
  });

  if(existingActiveCart){
    throw new ConflictException(`Un panier actif existe déjà pour l'utilisateur ${createCartDto.userId}`);
  }

    return this.prisma.cart.create({
      data: {
        ...createCartDto,
        status: 'ACTIVE',
        total: 0,
      },
      include: { products: true },
    });
  }

//  recupère tous les paniers

  async findAll() {
    return this.prisma.cart.findMany({
      include: {
        products: true,
        user: true,
      },
    });
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
        return this.prisma.product.findUnique({
      where: { id: productId },
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


