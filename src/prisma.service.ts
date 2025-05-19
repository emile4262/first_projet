import { Injectable, OnModuleInit, INestApplication, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  
constructor() {
  super();
}
  async onModuleInit() {
    await this.$connect();
  }
  async $connect(): Promise<void> {
    return super.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
  async $disconnect(): Promise<void> {
    return super.$disconnect();
  }
}