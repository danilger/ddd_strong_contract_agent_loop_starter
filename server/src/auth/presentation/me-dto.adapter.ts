import { Injectable } from '@nestjs/common';
import type { MeDto } from '@repo/contract';
import type { MeReadModel } from '../application/ports/user.read.repository.port';

/** ReadModel → MeDto */
@Injectable()
export class MeDtoAdapter {
  /**
   * Маппит read-модель в контрактный DTO.
   */
  adaptFromReadModel(model: MeReadModel): MeDto {
    return {
      userId: model.userId,
      email: model.email,
    };
  }
}
