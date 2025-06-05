import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../public.decorateur';

// Define or import JwtAuthUser interface
export interface JwtAuthUser {
  id: number;
  username: string;
  role: string;
  // add other properties as needed
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Vérifier si la route est marquée comme publique
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    // Sinon procéder à la vérification du JWT
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    
    // Si une erreur est survenue ou que l'utilisateur n'existe pas
    if (err || !user) {
      throw err || new UnauthorizedException('Token invalide ou expiré');
    }

    // S'assurer que le rôle est inclus dans l'objet user (si applicable)
    // Vérifier si user a une propriété 'role'
    if ((user as any).role === undefined) {
      throw new UnauthorizedException('Information de rôle manquante');
    }

    return user;
  }
}
    
