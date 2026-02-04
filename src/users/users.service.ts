import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto, ResetPasswordDto, VerifyOtpDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchDto } from './dto/search.dto';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import * as nodemailer from 'nodemailer';



@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) { }


  // async updateUserRole(userId: string, newRole: 'admin' | 'user'): Promise<User> {
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //   });

  //   if (!user) {
  //     throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
  //   }

  //   if (newRole === 'admin' && user.email !== 'brou@gmail.com') {
  //     throw new BadRequestException('Seul brou@gmail.com peut être administrateur');
  //   }

  //   return this.prisma.user.update({
  //     where: { id: userId },
  //     data: {
  //       role: newRole,
  //       admin: newRole === 'admin',
  //     },
  //   });
  // }

  

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, firstName, lastName } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const isAdmin = email === 'bnandoemile@gmail.com';

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        admin: isAdmin,
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date(),
      },
    });
    return user;

  }
  // obtenir tous les utilisateurs avec pagination et filtres
  async findAll(query: SearchDto) {
    const { page = 1, limit = 10, search, dateCreationDebut, dateCreationFin } = query || {};
    const take = Math.max(1, Number(limit || 10));
    const skip = (Math.max(1, Number(page || 1)) - 1) * take;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (dateCreationDebut || dateCreationFin) {
      where.createdAt = {};
      if (dateCreationDebut) where.createdAt.gte = new Date(dateCreationDebut);
      if (dateCreationFin) where.createdAt.lte = new Date(dateCreationFin);
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
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


  //  obténir un utilisateur pas sont id
  async findOne(id: string): Promise<Partial<User>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        admin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    return user;
  }

  // modifier un utilisateur par son id
  async update(id: string, updateUserDto: UpdateUserDto, ): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    return this.prisma.user.update({
      where: { id },
      data: user,
    });
  }
  //  supprimer un utlisateur
  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }
    await this.prisma.user.delete({ where: { id } });
  }

  // async findUserForAuth(email: string): Promise<User | null> {
  //   return this.prisma.user.findUnique({
  //     where: { email },
  //   });
  // }

  // connexion d'un utilisateur
  async login(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    access_token?: string;
    refresh_token?: string;
    user?: any;
     }> {
      try {
      const user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        return { success: false, message: 'Email incorrect' };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Mot de passe incorrect' };
      }

      // Seul 'bnandoemile@gmail.com' est considéré comme admin
      const userRole = email === 'bnandoemile@gmail.com' ? 'admin' : 'user';

      const payload = {
        sub: user.id,
        email: user.email,
        role: userRole,
      };

      const access_token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '30m',
      });

      const refresh_token = this.jwtService.sign(
        { sub: user.id },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: '2d',
        }
      );
      // Sauvegarder le refresh token en base
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: refresh_token,
        },
      });

      // Retourner les informations utilisateur sans le mot de passe
      const { password: _, refreshToken: __, ...userInfo } = user;

      return {
        success: true,
        message: 'Connexion réussie',
        access_token,
        refresh_token,

      };
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors de la connexion: ${error.message}`,
      };
    }
  }

  // async createAdmin(createUserDto: CreateUserDto): Promise<User> {
  //   const { email, password, firstName, lastName } = createUserDto;

  //   // Seul 'brou@gmail.com' peut être créé comme admin
  //   if (email !== 'brou@gmail.com') {
  //     throw new BadRequestException('Seul brou@gmail.com peut être administrateur');
  //   }

  //   const existingUser = await this.prisma.user.findUnique({
  //     where: { email },
  //   });

  //   if (existingUser) {
  //     throw new ConflictException('Cet email est déjà utilisé');
  //   }

  //   const hashedPassword = await bcrypt.hash(password, 10);

  //   return this.prisma.user.create({
  //     data: {
  //       firstName,
  //       lastName,
  //       email,
  //       password: hashedPassword,
  //       admin: true,
  //       role: 'admin',
  //       createdAt: new Date(),
  //     },
  //   });
  // }

  // Méthode utilitaire pour vérifier si un utilisateur est admin
  // async isUserAdmin(email: string): Promise<boolean> {
  //   return email === 'brou@gmail.com';
  // }

  // Méthode pour promouvoir un utilisateur en admin
  // async promoteToAdmin(userId: string): Promise<User> {
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //   });

  //   if (!user) {
  //     throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
  //   }

  //   // Seul 'brou@gmail.com' peut être promu admin
  //   if (user.email !== 'brou@gmail.com') {
  //     throw new BadRequestException('Seul brou@gmail.com peut être administrateur');
  //   }

  //   return this.updateUserRole(userId, 'admin');
  // }

  // Méthode pour rétrograder un admin en utilisateur normal
  // async demoteFromAdmin(userId: string): Promise<User> {
  //   return this.updateUserRole(userId, 'user');
  // }

  // Méthode pour rétrograder un admin en utilisateur normal
 
  async sendOtp(dto: ResetPasswordDto) {
    { } const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Générer un OTP aléatoire à 6 chiffres
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new BadRequestException('Configuration de l\'email manquante');
    }
    const otp = randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // expire dans 10 minutes

    await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        otp,
        otpExpires,
        lastPasswordResetAt: user.role !== 'admin' ? new Date() : user.lastPasswordResetAt, 
      },
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Réinitialisation du mot de passe</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <table width="100%" cellspacing="0" cellpadding="0" border="0" style="padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; padding: 30px; border-radius: 8px;">
              <tr>
                <td align="center" style="font-size: 24px; font-weight: bold; color: #333333;">
                  Réinitialisation du mot de passe 🔐
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 0; font-size: 16px; color: #555555;">
                  Bonjour ${user.lastName || 'utilisateur'},
                </td>
              </tr>
              <tr>
                <td style="font-size: 16px; color: #555555;">
                  Vous avez demandé à réinitialiser votre mot de passe. Voici votre code de vérification :
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <div style="font-size: 28px; font-weight: bold; color: #007bff; background-color: #e9f0fb; padding: 12px 24px; display: inline-block; border-radius: 4px;">
                    ${otp}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="font-size: 14px; color: #999999;">
                  Ce code expirera dans <strong>10 minutes</strong>.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 20px; font-size: 14px; color: #999999;">
                  Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 30px; font-size: 14px; color: #555555;">
                  Merci,<br/>
                  <p> L'équipe Ecommerce Merci </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

    const mailOptions = {
      from: `"Support Ecommerce" <${process.env.EMAIL_USER}>`,
      to: dto.email,
      subject: 'Réinitialisation de mot de passe - Code OTP',
      html: htmlContent,
    };

    try {
      await transporter.sendMail(mailOptions);
      // console.log(`Email OTP envoyé à ${dto.email}`);
    } catch (error) {
      // console.error("Erreur lors de l'envoi de l'email :", error);
      throw new BadRequestException("Impossible d'envoyer l'OTP par e-mail");
    }

    return {
      message: 'OTP envoyé à votre email',
    };
  }

  // Réinitialise le mot de passe avec l'OTP
  
  async resetPasswordWithOtp(dto: VerifyOtpDto) {
    // Nettoyer les données d'entrée
    const email = dto.email.trim().toLowerCase();
    const otp = dto.otp.trim();

    // Récupérer l'utilisateur avec son OTP
    const user = await this.prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }


    // Vérifier que l'OTP existe et n'est pas expiré
    if (!user.otp || !user.otpExpires) {
      throw new BadRequestException('Aucun OTP généré pour cet utilisateur');
    }

    if (user.otpExpires < new Date()) {
      throw new BadRequestException('OTP expiré');
    }

    // Comparaison plus robuste de l'OTP
    if (user.otp.trim() !== otp) {
      throw new BadRequestException(`OTP invalide - Reçu: "${otp}", Attendu: "${user.otp}"`);
    }


    // Valider le nouveau mot de passe (ajoutez vos règles de validation)
    if (!dto.newPassword || dto.newPassword.length < 8) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12); // 12 rounds pour plus de sécurité

    try {
      // Mettre à jour le mot de passe et supprimer l'OTP
      await this.prisma.user.update({
        where: { email: dto.email },
        data: {
          password: hashedPassword,
          otp: null, 
          otpExpires: null, 
          updatedAt: new Date() 
        },
      });
      return {
        message: 'Mot de passe réinitialisé avec succès'
      };

    } catch (error) {
      throw new BadRequestException('Erreur lors de la réinitialisation du mot de passe');
    }
  }

  //  Nettoie les OTP expirés (à appeler périodiquement)
   
  // async cleanupExpiredOtps() {
  //   const result = await this.prisma.user.updateMany({
  //     where: {
  //       otpExpires: { lt: new Date() }
  //     },
  //     data: {
  //       otp: null,
  //       otpExpires: null
  //     }
  //   });

  //   // console.log(`${result.count} OTP expirés nettoyés`);
  //   return result;
  // }

  //  Vérifie si un utilisateur a un OTP valide (utile pour debug)
  
  // async checkOtpStatus(email: string) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { email },
  //     select: {
  //       email: true,
  //       otp: true,
  //       otpExpires: true
  //     }
  //   });

  //   if (!user) {
  //     throw new NotFoundException('Utilisateur introuvable');
  //   }

  //   const hasValidOtp = user.otp && user.otpExpires && user.otpExpires > new Date();

  //   return {
  //     email: user.email,
  //     hasOtp: !!user.otp,
  //     otpExpires: user.otpExpires,
  //     isValid: hasValidOtp
  //   };
  // }

}

