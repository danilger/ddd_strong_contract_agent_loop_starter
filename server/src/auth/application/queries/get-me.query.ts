import { Query } from '@nestjs/cqrs';
import type { MeReadModel } from '../ports/user.read.repository.port';

/** Запрос текущей identity */
export class GetMeQuery extends Query<MeReadModel> {
  constructor(public readonly userId: string) {
    super();
  }
}
