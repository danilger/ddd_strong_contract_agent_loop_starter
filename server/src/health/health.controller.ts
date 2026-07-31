import { Controller } from '@nestjs/common';
import { healthContract } from '@repo/contract';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

/** Liveness endpoint */
@Controller()
export class HealthController {
  @TsRestHandler(healthContract.getHealth, { validateResponses: true })
  getHealth() {
    return tsRestHandler(healthContract.getHealth, async () => ({
      status: 200 as const,
      body: { ok: true as const },
    }));
  }
}
