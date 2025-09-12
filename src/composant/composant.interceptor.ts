import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ExcludeFieldsInterceptor implements NestInterceptor {
  constructor(private readonly fieldsToExclude: string[]) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (Array.isArray(data)) {
          return data.map((item) => this.exclude(item));
        }
        if (data && typeof data === 'object') {
          return this.exclude(data);
        }
        return data;
      }),
    );
  }

  private exclude(obj: any) {
    const clone = { ...obj };
    this.fieldsToExclude.forEach((field) => {
      delete clone[field];
    });
    return clone;
  }
}
