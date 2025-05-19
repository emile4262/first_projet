import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../public.decorateur';

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

  handleRequest(err, user, info) {
    // Si une erreur est survenue ou que l'utilisateur n'existe pas
    if (err || !user) {
      throw err || new UnauthorizedException('Token invalide ou expiré');
    }
    
    // S'assurer que le rôle est inclus dans l'objet user
    if (!user.role) {
      throw new UnauthorizedException('Information de rôle manquante');
    }
    
    return user;
  }
}
    
