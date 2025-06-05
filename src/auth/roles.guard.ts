import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core/services/reflector.service";
import { Role, ROLES_KEY } from "./role.decorateur";

// ...existing imports...
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // <-- Correction ici

    console.log('Requête utilisateur:', user);
    console.log('Rôles requis:', requiredRoles);

    if (!user) {
      console.log('Accès refusé: utilisateur non authentifié');
      throw new ForbiddenException('Accès interdit : utilisateur non authentifié');
    }

    const userRole = user.role;
    console.log(`Rôle de l'utilisateur: ${userRole}`);

    const hasRole = requiredRoles.some(role => role === userRole);

    if (!hasRole) {
      console.log(`Accès refusé: rôle requis non trouvé (a: ${userRole}, requis: ${requiredRoles.join(', ')})`);
      throw new ForbiddenException('Accès interdit : rôle insuffisant');
    }

    console.log('Accès autorisé');
    return true;
  }
}