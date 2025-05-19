import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from './role.decorateur';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Récupère les rôles requis pour l'endpoint
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si aucun rôle n'est requis, autoriser l'accès
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Récupère la requête
    const request = context.switchToHttp().getRequest();
    
    // IMPORTANT: Utilisez request.user au lieu de request.admin
    // C'est la propriété standard où JwtAuthGuard stocke les informations d'utilisateur
    const user = request.user;
    
    console.log('Requête utilisateur:', user);
    console.log('Rôles requis:', requiredRoles);
    
    // Vérifiez que l'utilisateur existe
    if (!user) {
      console.log('Accès refusé: utilisateur non authentifié');
      throw new ForbiddenException('Accès interdit : utilisateur non authentifié');
    }
    
    // Vérifiez le rôle dans la propriété 'role' (au singulier), pas 'Roles' (avec majuscule)
    const userRole = user.role;
    console.log(`Rôle de l'utilisateur: ${userRole}`);
    
    // Vérifiez si l'utilisateur a le rôle requis
    const hasRole = requiredRoles.some(role => role === userRole);
    
    if (!hasRole) {
      console.log(`Accès refusé: rôle requis non trouvé (a: ${userRole}, requis: ${requiredRoles.join(', ')})`);
      throw new ForbiddenException('Accès interdit : rôle insuffisant');
    }
    
    console.log('Accès autorisé');
    return true;
  }
}