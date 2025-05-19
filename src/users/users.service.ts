import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/auth/role.decorateur';
import { create } from 'domain';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  // ✅ créer un utilisateur
  async createUser(createUserDto: CreateUserDto, _Roles: string): Promise<User> {
    const { email, password, firstName, lastName, admin = false } = createUserDto;

    // vérifier si l'utilisateur existe dejà dans la bd
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }
    
    const hashedPassword = await bcrypt.hash(password, 8);

    const finalRole = _Roles !== 'admin' ? 'user' : _Roles;

    // Créer un nouvel utilisateur
    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        admin: true || false ,
        createdAt: new Date(),
        role: finalRole, 
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
        admin: true || false,
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
        admin: true || false,
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

  // connecter un utilisateur
  async login(email: string, password: string): Promise<{ success: boolean; message: string; user?: any; access_token?: string }> {
    try {
      // Recherche de l'utilisateur par email
      const user = await this.prisma.user.findUnique({
        where: { email },
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
      const userWithRoles = { ...user };
      if (email === 'kassi@gmail.com') {
        userWithRoles.role = 'admin';
      }

      // Générer un token
      const payload = { sub: user.id, email: user.email, role: userWithRoles.role };
      console.log("payload", payload);
      console.log(`Token généré pour l'utilisateur ID: ${user.id}`);
      const token = this.jwtService.sign(payload);
    
      return {
        success: true,
        message: 'Connexion réussie',
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: userWithRoles.role,
          createdAt: user.createdAt,
        }
      };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return {
        success: false,
        message: 'Une erreur est survenue lors de la connexion',
      };
    }
  }

  /**
   * Crée un nouvel utilisateur
   * @param createUserDto DTO contenant les données de l'utilisateur
   * @returns L'utilisateur créé
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Utilisation de la méthode createUserInternal avec les bons paramètres
      return await this.createUserInternal(createUserDto, 'user');
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw new Error(`Impossible de créer l'utilisateur: ${error.message}`);
    }
  }

  /**
   * Méthode interne pour créer un utilisateur (renommée pour éviter les doublons)
   * @param createUserDto DTO contenant les données de l'utilisateur
   * @param role Rôle à attribuer à l'utilisateur
   * @returns L'utilisateur créé
   */
  async createUserInternal(createUserDto: CreateUserDto, role: string): Promise<User> {
    // Vérifie si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Cryptage du mot de passe
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Création de l'utilisateur dans la base de données
    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: role,
        admin: true || false, 
      }
    });

    return newUser;
  }

  /**
   * Méthode pour vérifier les identifiants d'un utilisateur
   * @param email Email de l'utilisateur
   * @param password Mot de passe de l'utilisateur
   * @returns Utilisateur vérifié ou null
   */
  async verifyUser(email: string, password: string): Promise<User | null> {
    // Recherche de l'utilisateur par email
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    // Vérification si l'utilisateur existe
    if (!user) {
      return null;
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    return isPasswordValid ? user : null;
  }
}