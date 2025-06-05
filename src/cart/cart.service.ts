import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Cart } from '@prisma/client';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartStatusDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(public readonly prisma: PrismaService) {}

  // 🛒 Créer un panier ou ajouter un produit à un panier existant
 async create(data: CreateCartDto, userId: string): Promise<Cart> {
  const {
    productId,
    quantity,
    
  } = data;

 

    //  Vérification du produit 
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        stock: true,
        Is_available: true,
        price: true,
      },
    });
    console.log('Product trouvé ?', product);
    if (!product) throw new NotFoundException('Produit non trouvé');
    if (!product.Is_available) throw new BadRequestException('Produit non disponible');
    if (product.stock < quantity) throw new BadRequestException('Stock insuffisant');

    // Recherche d’un panier existant pour cet utilisateur ---
    const existingCart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        cartProducts: true, // Inclure les produits pour vérifier si le produit existe déjà dans le panier
      },
    });

    const productPrice = product.price;
    const totalPrice = productPrice * quantity;

    //  Logique conditionnelle : Panier existant ou nouveau panier ---
    if (existingCart) {
      // Panier existant : Mettre à jour la quantité d'un produit ou ajouter un nouveau produit
      const existingCartProduct = existingCart.cartProducts.find(
        (p) => p.productId === productId,
      );

      if (existingCartProduct) {
        // Le produit est déjà dans le panier : Mettre à jour sa quantité
        await this.prisma.cartproduct.update({
          where: { id: existingCartProduct.id },
          data: {
            quantity: existingCartProduct.quantity + quantity,
          },
        });
      } else {
        // Le produit n'est pas dans le panier : Ajouter le produit au panier existant
        await this.prisma.cartproduct.create({
          data: {
            cartId: existingCart.id,
            productId,
            quantity,
          },
        });
      }

      // Retourne le panier mis à jour avec ses produits
      const updatedCart = await this.prisma.cart.findUnique({
        where: { id: existingCart.id },
        include: { cartProducts: true },
      });

      if (!updatedCart) {
        throw new NotFoundException('Panier non trouvé après la mise à jour (ceci ne devrait pas arriver)');
      }
      return updatedCart;

    } else {
      // Pas de panier existant : Créer un nouveau panier pour l'utilisateur
      if (!userId) {
        throw new NotFoundException('L\'ID de l\'utilisateur est requis pour créer un panier.');
      }

      // Création du nouveau panier avec l'utilisateur et le premier produit
      const newCart = await this.prisma.cart.create({
        data: {
          user: {
            connect: {
              id: userId,
            },
          },
          cartProducts: {
            create: [
              {
                productId,
                quantity,
              },
            ],
          },
        },
      });

    // Retourne le nouveau panier créé
    return newCart;
    }
  }

  // 📦 Récupérer tous les paniers
  async findAll(cartId: string): Promise<Cart[]> {
    return this.prisma.cart.findMany({
      where: { id : cartId },
      include: {
        cartProducts: true,
      },
    });
  }

  // 💰 Récupérer le total du panier pour un utilisateur
  async getTotalCart(userId: string): Promise<number> {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        cartProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.cartProducts.length === 0) return 0;

    // ➗ Calcul du total
    return cart.cartProducts.reduce((total, cartProduct) => {
      return total + cartProduct.quantity * cartProduct.product.price;
    }, 0);
  }

  // 🔄 Mise à jour du statut d’un panier
  async updateCartStatus(cartProductId: number, dto: UpdateCartStatusDto, id: string): Promise<Cart> {
    const cart = await this.prisma.cart.findUnique({ where: { id } });
    if (!cart) throw new NotFoundException('Panier non trouvé');
    return cart;
  }

    //  suprimer  les produit dans un panier
async remove(id: string, cartProductId: string): Promise<void> { 
    const cartProduct = await this.prisma.cartproduct.findUnique({
    where: { id: cartProductId },
  });

  if (!cartProduct) {
    throw new NotFoundException('Produit du panier non trouvé');
  }

  await this.prisma.cartproduct.delete({
    where: { id: cartProductId }, 
  });
}

}
