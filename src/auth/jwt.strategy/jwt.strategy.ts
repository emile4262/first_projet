import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { Admin } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService, // Injecter votre service utilisateur
  ) {
   super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: configService.get<string>('JWT_SECRET') as string
});

  }

  async validate(payload: any) {
    
    // Récupérer les détails complets de l'utilisateur, y compris son rôle
    const user = await this.usersService.findOne(payload.sub);
    
    if (!user) {
      return null; // Cela déclenchera une exception dans handleRequest()
    }
    
    // Retourner l'objet utilisateur avec son rôle
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}