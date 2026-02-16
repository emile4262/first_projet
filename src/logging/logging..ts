import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggingService } from './logging.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const userId = (request as any)?.user?.userId;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const duration = Date.now() - startTime;
          
          // Log de la requête HTTP
          this.loggingService.logRequest(method, url, userId, statusCode);
          
          // Log de performance
          this.loggingService.log(`Request completed in ${duration}ms`, 'Performance');
          
          // Log CRUD pour les requêtes réussies
          if (statusCode >= 200 && statusCode < 300) {
            this.loggingService.logCrud('READ', 'HTTP_REQUEST', url, userId);
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          
          // Log de la requête échouée
          this.loggingService.logRequest(method, url, userId, 500);
          
          // Log de l'erreur
          this.loggingService.error(`Request failed after ${duration}ms: ${error.message}`, error.stack, 'HTTP');
          
          // Log CRUD pour les requêtes échouées
          this.loggingService.logCrud('CREATE', 'HTTP_ERROR', url, userId);
        },
      }),
    );
  }
}
