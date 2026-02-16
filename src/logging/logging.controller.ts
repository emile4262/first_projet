import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/config/jwt-auth/jwt-auth.guard";
import { RolesGuard } from "src/config/roles.guard";
import { LoggingService} from "./logging.service";
import { SearchLogDto } from "./dto/search.log.dto";
import { CreateLogDto } from "./dto/createLog.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('logging')
@ApiBearerAuth()
@Controller('logging')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un log d\'information' })
  @ApiResponse({ status: 201, description: 'Log créé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async createLog(@Body() createLogDto: CreateLogDto) {
    return this.loggingService.createLog(createLogDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les logs d\'information' })
  @ApiResponse({ status: 200, description: 'Logs récupérés avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async findAllLogs(@Query() query: SearchLogDto) {
    return this.loggingService.findAllLogs(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des logs d\'information' })
  @ApiResponse({ status: 200, description: 'Logs récupérés avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async searchLogs(@Query() query: SearchLogDto) {
    return this.loggingService.searchLogs(query);
  }

  @Get('readlog')
  @ApiOperation({ summary: 'Lire un log d\'information' })
  @ApiResponse({ status: 200, description: 'Log lu avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async readLog() {
    return this.loggingService.createLog({
      message: 'Lecture d\'un log d\'information',
      level: 'info',
    });
  }

   }