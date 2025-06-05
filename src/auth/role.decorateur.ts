import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export enum Role {
  user = 'user',
  admin = 'admin',
}

export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);