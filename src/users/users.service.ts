import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  // Méthode pour exclure le mot de passe et le rôle
  private excludeSensitiveFields(user: User): Omit<User, 'password' | 'role'> {
    const { password, role, ...safeUser } = user;
    return safeUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async verifyUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }

  async updateUserRole(userId: string, newRole: 'admin' | 'user'): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    if (newRole === 'admin' && user.email !== 'brou@gmail.com') {
      throw new BadRequestException('Seul brou@gmail.com peut être administrateur');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        admin: newRole === 'admin',
      },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password' | 'role'>> {
    return this.createUser(createUserDto);
  }

  async createUser(createUserDto: CreateUserDto): Promise<Omit<User, 'password' | 'role'>> {
    const { email, password, firstName, lastName } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const isAdmin = email === 'brou@gmail.com';

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

    return this.excludeSensitiveFields(user);
  }
// obténir tous les utilisateurs
  async findAll(): Promise<Partial<User>[]> {
    return this.prisma.user.findMany({
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
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    const updateData: any = { ...updateUserDto };

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Synchroniser les champs admin et role si l'un d'eux est mis à jour
    if (updateUserDto.role) {
      updateData.admin = updateUserDto.role === 'admin';
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }
//  supprimer un utlisateur
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
  }

  async findUserForAuth(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
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
      const user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        return { success: false, message: 'Email incorrect' };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Mot de passe incorrect' };
      }

      // Seul 'brou@gmail.com' est considéré comme admin
      const userRole = email === 'brou@gmail.com' ? 'admin' : 'user';

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

  async createAdmin(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, firstName, lastName } = createUserDto;

    // Seul 'brou@gmail.com' peut être créé comme admin
    if (email !== 'brou@gmail.com') {
      throw new BadRequestException('Seul brou@gmail.com peut être administrateur');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        admin: true,
        role: 'admin',
        createdAt: new Date(),
      },
    });
  }

  // Méthode utilitaire pour vérifier si un utilisateur est admin
  async isUserAdmin(email: string): Promise<boolean> {
    return email === 'brou@gmail.com';
  }

  // Méthode pour promouvoir un utilisateur en admin
  async promoteToAdmin(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    // Seul 'brou@gmail.com' peut être promu admin
    if (user.email !== 'brou@gmail.com') {
      throw new BadRequestException('Seul brou@gmail.com peut être administrateur');
    }

    return this.updateUserRole(userId, 'admin');
  }

  // Méthode pour rétrograder un admin en utilisateur normal
  async demoteFromAdmin(userId: string): Promise<User> {
    return this.updateUserRole(userId, 'user');
  }
}