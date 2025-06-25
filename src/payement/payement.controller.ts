import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PaginationOptions, PaymentService, PaymentStatus } from './payement.service';
import { CreatePayementDto, PayementStatus, UpdatePayementDto } from './dto/create-payement.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role, Roles } from 'src/auth/role.decorateur';

@ApiTags('Paiements')
@Controller('payments')
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // CRÉATION ET GESTION DES PAIEMENTS

  @Post() // Suppression du décorateur @Post() dupliqué
  @ApiOperation({ summary: 'Créer un nouveau paiement' })
  @ApiResponse({ status: 201, description: 'Paiement créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  @ApiBody({ type: CreatePayementDto })
  async create(@Body() createPaymentDto: CreatePayementDto, @Request() req) {
    return {
      statusCode: HttpStatus.CREATED, // Ajout du code de statut pour plus de clarté
      message: 'Paiement créé avec succès',
      data: await this.paymentService.create(createPaymentDto, req.user.id),
    };
  }

  // @Get(':id')
  // @ApiOperation({ summary: 'Récupérer un paiement par ID' })
  // @ApiParam({ name: 'id', description: 'ID du paiement' })
  // @ApiResponse({ status: 200, description: 'Paiement trouvé' })
  // @ApiResponse({ status: 404, description: 'Paiement non trouvé' })
  // async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
  //   return {
  //     statusCode: HttpStatus.OK, // Ajout du code de statut
  //     data: await this.paymentService.findById(id, req.user.id),
  //   };
  // }

  // @Get()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.admin)
  // @ApiOperation({ summary: 'Récupérer un paiement par ID' })
  // @ApiParam({ name: 'id', description: 'ID du paiement' })
  // @ApiResponse({ status: 200, description: 'Paiement trouvé' })
  // @ApiResponse({ status: 404, description: 'Paiement non trouvé' })
  // async getPayment(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Request() req
  // ) {
  //   const payment = await this.paymentService.findById(id, req.user.id);
  //   if (!payment) {
  //     throw new BadRequestException('Paiement non trouvé');
  //   }
  //   return {
  //     // statusCode: HttpStatus.OK, // Ajout du code de statut
  //     data: payment,
  //   };
  // }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Mettre à jour un paiement' })
  @ApiParam({ name: 'id', description: 'ID du paiement' })
  @ApiResponse({ status: 200, description: 'Paiement mis à jour' })
  @ApiResponse({ status: 404, description: 'Paiement non trouvé' })
  @ApiBody({ type: UpdatePayementDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentDto: UpdatePayementDto,
    @Request() req,
  ) {
    return {
      // statusCode: HttpStatus.OK, // Ajout du code de statut
      message: 'Paiement mis à jour avec succès',
      data: await this.paymentService.updatePayment(
        id,
        updatePaymentDto,
        req.user.id,
      ),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Supprimer un paiement' })
  @ApiParam({ name: 'id', description: 'ID du paiement' })
  @ApiResponse({ status: 200, description: 'Paiement supprimé' })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer ce paiement',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.paymentService.deletePayment(id, req.user.id);
    return {
      statusCode: HttpStatus.OK, // Ajout du code de statut
      message: 'Paiement supprimé avec succès',
    };
  }

  // GESTION DES STATUTS

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Annuler un paiement' })
  @ApiParam({ name: 'id', description: 'ID du paiement' })
  @ApiResponse({ status: 200, description: 'Paiement annulé' })
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return {
      statusCode: HttpStatus.OK, // Ajout du code de statut
      message: 'Paiement annulé avec succès',
      data: await this.paymentService.cancelPayement(id, req.user.id),
    };
  }

  @Put(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Confirmer un paiement (Admin seulement)' })
  @ApiParam({ name: 'id', description: 'ID du paiement' })
  @ApiResponse({ status: 200, description: 'Paiement confirmé' })
  async confirm(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Accès réservé aux administrateurs');
    }

    return {
      statusCode: HttpStatus.OK, // Ajout du code de statut
      message: 'Paiement confirmé avec succès',
      data: await this.paymentService.confirmPayement(id),
    };
  }

  // Si vous implémentez une méthode failPayment dans votre service, décommentez ceci
  // @Put(':id/fail')
  // @ApiOperation({ summary: 'Marquer un paiement comme échoué (Admin seulement)' })
  // @ApiParam({ name: 'id', description: 'ID du paiement' })
  // @ApiResponse({ status: 200, description: 'Paiement marqué comme échoué' })
  // async fail(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
  //   if (req.user.role !== 'admin') {
  //     throw new BadRequestException('Accès réservé aux administrateurs');
  //   }
  //   // return {
  //   //   statusCode: HttpStatus.OK,
  //   //   message: 'Paiement marqué comme échoué',
  //   //   data: await this.paymentService.failPayment(id)
  //   // };
  // }

  // REMBOURSEMENTS

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Traiter un remboursement' })
  @ApiParam({ name: 'id', description: 'ID du paiement à rembourser' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description:
            'Montant à rembourser (optionnel, par défaut le montant total)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Remboursement traité' })
  async refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { amount?: number },
    @Request() req,
  ) {
    return {
      statusCode: HttpStatus.CREATED, // Ajout du code de statut
      message: 'Remboursement traité avec succès',
      data: await this.paymentService.processRefund(
        id,
        body.amount,
        req.user.id,
      ),
    };
  }

  // RECHERCHE ET FILTRAGE

  @Get('status/:status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Récupérer les paiements par statut' })
  @ApiParam({ name: 'status', enum: PayementStatus, description: 'Statut des paiements' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paiements par statut' })
  async getByStatus(
    @Param('status') status: PayementStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Request() req,
  ) {
    if (!Object.values(PayementStatus).includes(status)) {
      throw new BadRequestException('Statut invalide');
    }

    return {
      statusCode: HttpStatus.OK, // Ajout du code de statut
      data: await this.paymentService.getPaymentsByStatus(
        status as unknown as PaymentStatus,
        req.user.id,
        {
          page,
          limit,
        },
      ),
    };
  }

  // @Get('date-range') // Nouvel endpoint pour la recherche par plage de dates
  // @ApiOperation({ summary: 'Récupérer les paiements par période' })
  // @ApiQuery({ name: 'startDate', required: false, type: String, format: 'date' })
  // @ApiQuery({ name: 'endDate', required: false, type: String, format: 'date' })
  // @ApiQuery({ name: 'page', required: false, type: Number })
  // @ApiQuery({ name: 'limit', required: false, type: Number })
  // @ApiResponse({ status: 200, description: 'Paiements filtrés par date' })
  // async getByDateRange(
  //   @Query() query: GetPaymentsByDateRangeDto, // Utilisation du DTO dédié
  //   @Request() req,
  // ) {
  //   const { startDate, endDate, page, limit } = query;

  //   // Convertir les chaînes de caractères en objets Date si elles existent
  //   const start = startDate ? new Date(startDate) : undefined;
  //   const end = endDate ? new Date(endDate) : undefined;

  //   if (start && end && start > end) {
  //     throw new BadRequestException(
  //       'La date de début ne peut pas être postérieure à la date de fin.',
  //     );
  //   }

  //   return {
  //     statusCode: HttpStatus.OK,
  //     data: await this.paymentService.getPaymentsByDateRange(
  //       start,
  //       end,
  //       req.user.id,
  //       { page, limit },
  //     ),
  //   };
  // }

  // HISTORIQUE ET STATISTIQUES

  @Get('history/user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiOperation({
    summary: "Récupérer l'historique des paiements de l'utilisateur",
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Historique des paiements' })
  async getUserHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Request() req,
  ) {
    return {
      // statusCode: HttpStatus.OK, // Ajout du code de statut
      data: await this.paymentService.getUserPaymentHistory(req.user.id, {
        page,
        limit,
      }),
    };
  }

    /**
   * Récupérer l'historique des paiements d'un utilisateur
   */
  @Get('history/user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Récupérer l\'historique des paiements d\'un utilisateur' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page' })
  @ApiResponse({ status: 200, description: 'Historique récupéré' })
  async getUserPaymentHistory(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
    @Request() req?: any
  ) {
    const currentUserId = req?.user?.id;
    const userRole = req?.user?.role;
    
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Accès réservé aux administrateurs');
    }

    
    const options: PaginationOptions = { page, limit };
    return this.paymentService.getPaymentHistory(userId, options);
  }

  @Get('admin/statistics') 
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Récupérer les statistiques globales (Admin)' })
  @ApiResponse({
    // status: 200,
    description: 'Statistiques globales des paiements',
  })
  async getGlobalStatistics(@Request() req) {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Accès réservé aux administrateurs');
    }

    return {
      // statusCode: HttpStatus.OK,
      data: await this.paymentService.getPaymentStatistics(), // Pas de userId pour les statistiques globales
    };
  }

@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@ApiOperation({ summary: 'Récupérer la listes de tout les paiements (Admin)' })
@ApiResponse({ status: 200, description: 'Liste de tous les paiements (Admin)' })
async getAllPayments(@Request() req) {
  // Vérifier si l'utilisateur est admin
  if (req.user.role !== 'admin') {
    throw new BadRequestException('Accès réservé aux administrateurs');
  }
  return {
    data: await this.paymentService.getAllUserPaymentsSummary(),
  };
}


  // Décommentez et implémentez si votre service a ces méthodes
  // @Get('reports/monthly')
  // async getMonthlyReport(
  //   @Query('year', ParseIntPipe) year: number,
  //   @Query('month', ParseIntPipe) month: number,
  // ) {
  //   // return this.reportsService.getMonthlyReport(year, month);
  // }

  // @Post('mobile-money')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.admin)
  // @ApiOperation({ summary: 'Payer avec de l\'argent mobile' })
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       amount: { type: 'number', description: 'Montant à payer' },
  //       phone: { type: 'string', description: 'Numéro de téléphone' },
  //       operator: { type: 'string', description: 'Opérateur de téléphonie' },
  //     },
  //   },
  // })
  // @ApiResponse({ status: 201, description: 'Paiement mobile effectué avec succès' })
  // @ApiResponse({ status: 400, description: 'Données invalides' })
  // async payMobile(@Body() body: { amount: number; phone: string; operator: string }) {
  //   return this.paymentService.payWithMobileMoney(body.amount, body.phone, body.operator);
  // }
}