import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ResetPasswordDto, VerifyOtpDto } from './dto/create-auth.dto';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as nodemailer from 'nodemailer';


@Injectable()
export class AuthService {
   constructor(
      private readonly prisma: PrismaService,
      private readonly jwtService: JwtService
    ) {
      // Vérifier que le JwtService est bien configuré
      // console.log('AuthService initialized - JWT_SECRET available:', !!process.env.JWT_SECRET);
    }

  // connexion d'un utilisateur
  async login(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    access_token?: string;
    refresh_token?: string;
    user?: any;
     }> {
      try {
      // Vérifier que le JWT secret est disponible
      // console.log('JWT_SECRET from process.env:', process.env.JWT_SECRET);
      
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
          secret: process.env.JWT_SECRET,
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

    const user = await this.prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (!user.otp || !user.otpExpires) {
      throw new BadRequestException('Aucun OTP généré pour cet utilisateur');
    }

    if (user.otpExpires < new Date()) {
      throw new BadRequestException('OTP expiré');
    }
    if (user.otp.trim() !== otp) {
      throw new BadRequestException(`OTP invalide - Reçu: "${otp}", Attendu: "${user.otp}"`);
    }

    if (!dto.newPassword || dto.newPassword.length < 8) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
    }
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

}
