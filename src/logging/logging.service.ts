import { Injectable } from "@nestjs/common";
import { CreateLogDto } from "./dto/createLog.dto";
import { PrismaService } from "src/prisma.service";
import { SearchLogDto } from "./dto/search.log.dto";
import { Logging } from "@prisma/client";


@Injectable()
export class LoggingService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}


// methode pour créer un log d'information

async createLog(createLogDto: CreateLogDto): Promise<Logging> {
try{
  const logger = await this.prisma.logging.create({
    data: {
      message: createLogDto.message,
      level: createLogDto.level,  
    },
  });
  return logger;
}catch(error){
  console.error('Erreur lors de la création du log:', error);
  throw error; 
}
  }

  // methode pour récupérer tous les logs d'information
  async findAllLogs(query: SearchLogDto) {
    const { page = 1, limit = 10, search, dateCreationDebut, dateCreationFin } = query || {};
    const take = Math.max(1, Number(limit || 10));
    const skip = (Math.max(1, Number(page || 1)) - 1) * take;

    const where: any = {};
    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { level: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (dateCreationDebut || dateCreationFin) {
      where.createdAt = {};
      if (dateCreationDebut) where.createdAt.gte = new Date(dateCreationDebut);
      if (dateCreationFin) where.createdAt.lte = new Date(dateCreationFin);
    }

    const [data, total] = await Promise.all([
      this.prisma.logging.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.logging.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take),
      },
    };
  }

  // methode pour filtrer les logs d'information par mot-clé
  async searchLogs(query: SearchLogDto): Promise<any[]> {
    const { search } = query;
    return this.prisma.logging.findMany({
      where: {
        OR: [
          { message: { contains: search, mode: 'insensitive' } },
          { level: { contains: search, mode: 'insensitive' } },
        ],
      },
    });
  }

  // methode pour lire les log

  async readLog(id: string): Promise<any> {
    const log = await this.prisma.logging.findUnique({
      where: { id },
    });
    if (!log) {
      throw new Error('Log non trouvé');
    }
    return log;
  }

}

  