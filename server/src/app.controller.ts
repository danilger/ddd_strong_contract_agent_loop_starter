import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { helloContract } from '@repo/contract';
import { AppService } from './app.service';

/** HTTP-вход примера hello по контракту */
@Controller()
export class AppController {
  /**
   * Создаёт контроллер hello.
   * @param appService сервис приветствия
   */
  constructor(private readonly appService: AppService) {}

  /** Отдаёт hello по ts-rest контракту */
  @TsRestHandler(helloContract.getHello, { validateResponses: true })
  getHello() {
    return tsRestHandler(helloContract.getHello, async () => ({
      status: 200 as const,
      body: this.appService.getHello(),
    }));
  }
}
