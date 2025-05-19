import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, } from '@nestjs/passport';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('protected')
  @UseGuards(AuthGuard('jwt'))
  getProtected(): object {
    return { message: 'Vous avez accès à ce parcours protégé !' };
  }
 
}





 


