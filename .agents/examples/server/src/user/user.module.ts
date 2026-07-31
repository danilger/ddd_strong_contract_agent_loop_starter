import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateUserCommandHandler } from './application/commands/create-user.command.handler';
import { DeleteUserCommandHandler } from './application/commands/delete-user.command.handler';
import { UpdateUserCommandHandler } from './application/commands/update-user.command.handler';
import { UserCreatedDomainEventHandler } from './application/event-handlers/user-created.domain-event.handler';
import { UserDeletedDomainEventHandler } from './application/event-handlers/user-deleted.domain-event.handler';
import { UserNameUpdatedDomainEventHandler } from './application/event-handlers/user-name-updated.domain-event.handler';
import { USER_READ_REPOSITORY } from './application/ports/user.read.repository.port';
import { USER_WRITE_REPOSITORY } from './application/ports/user.write.repository.port';
import { GetUserQueryHandler } from './application/queries/get-user.query.handler';
import { ListUsersQueryHandler } from './application/queries/list-users.query.handler';
import { DrizzleUserRepositoryAdapter } from './infrastructure/adapters/drizzle-user.repository.adapter';
import { CreateUserCommandAdapter } from './presentation/create-user-command.adapter';
import { UpdateUserCommandAdapter } from './presentation/update-user-command.adapter';
import { UserController } from './presentation/user.controller';
import { UserDtoAdapter } from './presentation/user-dto.adapter';

@Module({
  imports: [CqrsModule],
  controllers: [UserController],
  providers: [
    CreateUserCommandHandler,
    UpdateUserCommandHandler,
    DeleteUserCommandHandler,
    GetUserQueryHandler,
    ListUsersQueryHandler,
    UserCreatedDomainEventHandler,
    UserNameUpdatedDomainEventHandler,
    UserDeletedDomainEventHandler,
    CreateUserCommandAdapter,
    UpdateUserCommandAdapter,
    UserDtoAdapter,
    DrizzleUserRepositoryAdapter,
    {
      provide: USER_WRITE_REPOSITORY,
      useExisting: DrizzleUserRepositoryAdapter,
    },
    {
      provide: USER_READ_REPOSITORY,
      useExisting: DrizzleUserRepositoryAdapter,
    },
  ],
})
export class UserModule {}
