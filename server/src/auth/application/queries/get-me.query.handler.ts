import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SessionInvalidError } from '../../domain/errors/auth.errors';
import {
  USER_READ_REPOSITORY,
  type MeReadModel,
  type UserReadRepositoryPort,
} from '../ports/user.read.repository.port';
import { GetMeQuery } from './get-me.query';

@Injectable()
@QueryHandler(GetMeQuery)
export class GetMeQueryHandler implements IQueryHandler<
  GetMeQuery,
  MeReadModel
> {
  constructor(
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: UserReadRepositoryPort,
  ) {}

  /**
   * Возвращает identity текущего пользователя.
   */
  async execute(query: GetMeQuery): Promise<MeReadModel> {
    const model = await this.userReadRepository.findById(query.userId);
    if (!model) {
      throw new SessionInvalidError();
    }
    return model;
  }
}
