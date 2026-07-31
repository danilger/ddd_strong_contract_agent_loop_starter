import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  USER_READ_REPOSITORY,
  UserReadModel,
  UserReadRepositoryPort,
} from '../ports/user.read.repository.port';
import { ListUsersQuery } from './list-users.query';

@Injectable()
@QueryHandler(ListUsersQuery)
export class ListUsersQueryHandler implements IQueryHandler<ListUsersQuery> {
  constructor(
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: UserReadRepositoryPort,
  ) {}

  async execute(_query: ListUsersQuery): Promise<UserReadModel[]> {
    return this.userReadRepository.findAll();
  }
}
