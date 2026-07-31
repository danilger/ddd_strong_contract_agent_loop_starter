import { Injectable } from '@nestjs/common';
import type { HelloDto } from '@repo/contract';

/** Пример application-логики приветствия */
@Injectable()
export class AppService {
  /** Собирает DTO приветствия для GET / */
  getHello(): HelloDto {
    return { message: 'Hello World!' };
  }
}
