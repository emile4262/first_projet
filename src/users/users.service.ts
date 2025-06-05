import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma.service';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
// Suppression des imports inutilisés
// import { create } from 'domain';
// import { Admin } from 'typeorm';

@Injectable()
export class UsersService {
  
  findByEmail(email: string) {
    throw new Error('Method not implemented.');
  }
  verifyUser(email: string, password: string) {
    throw new Error('Method not implemented.');
  }
  // Cette méthode sera implémentée plus tard ou peut être supprimée si non utilisée
  updateUserRole(userId: string, newRole: string) {
    throw new Error('Method not implemented.');
  }
  
  // Suppression de la propriété orpheline ou définir correctement son utilité
  // verifyUser: string;
  
  // Implémenter la méthode create en réutilisant createUser
  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.createUser(createUserDto);
  }
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  // ✅ créer un utilisateur
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, firstName, lastName } = createUserDto;

    // vérifier si l'utilisateur existe dejà dans la bd
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // if (!email || !password) {
    //   throw new ConflictException('Email et mot de passe sont requis');
    // }
    
    const hashedPassword = await bcrypt.hash(password, 8);
   
    // Créer un nouvel utilisateur
    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        admin: createUserDto.admin || false,  
        role: createUserDto.role as Role || Role.admin, 
        createdAt: new Date(),
      },
    });
    return user; 
  }

  // obtenir tous les utilisateurs
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        admin: false, // Correction de admin: true || false
        role: true,
        createdAt: true,
      },
    });
  }

  async findAllWithproducts(): Promise<any[]> {
    return this.prisma.user.findMany({
      include: {
        products: true,
      },
    });
  }

  // obtenir un utilisateur par son id 
  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        admin: true,
        role: true, 
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    return user;
  }

  // modifier un utilisateur
  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 8);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  // supprimer un utilisateur
  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id: id.toString() },
    });
  }

  async login(email: string, password: string): Promise<{ success: boolean; message: string; user?: any; access_token?: string }> {
    try {
      // Recherche de l'utilisateur par email
      const user = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      // Vérification si l'utilisateur existe
      if (!user) {
        return {
          success: false,
          message: 'Email incorrect',
        };
      }
      
      // Vérification du mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Mot de passe incorrect',
        };
      }
        
      // Gestion spéciale pour l'utilisateur admin
      const userWithRoles = { ...user, role: user.admin ? 'admin' : 'user' };
      if (email === 'kassi@gmail.com') {
        userWithRoles.role = 'admin';
      }
      
      
       // Génération du token d'accès (JWT)
      const payload = { 
        sub: user.id, 
        email: user.email,
        role: userWithRoles.role || 'user' // Changement de 'admin' à 'user' comme fallback
      };
      const access_token = this.jwtService.sign(payload);
      
      return {
        success: true,
        message: 'Connexion réussie',
        access_token: access_token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors de la connexion: ${error.message}`,
      };
    }
  }
    // créer un user admin  et authentifier
  async createAdmin(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, firstName, lastName } = createUserDto;

    // vérifier si l'utilisateur existe dejà dans la bd
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    // Créer un nouvel utilisateur
    const user = await this.prisma.user.create({
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
    return user;
  }
}