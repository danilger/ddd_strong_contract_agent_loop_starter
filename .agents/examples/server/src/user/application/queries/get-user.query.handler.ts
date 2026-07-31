import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  USER_READ_REPOSITORY,
  UserReadModel,
  UserReadRepositoryPort,
} from '../ports/user.read.repository.port';
import { GetUserQuery } from './get-user.query';

@Injectable()
@QueryHandler(GetUserQuery)
export class GetUserQueryHandler implements IQueryHandler<GetUserQuery> {
  constructor(
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: UserReadRepositoryPort,
  ) {}

  async execute(query: GetUserQuery): Promise<UserReadModel> {
    const user = await this.userReadRepository.findById(query.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
