import { Controller, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { userContract } from '@repo/contract';
import { UserReadModel } from '../application/ports/user.read.repository.port';
import { DeleteUserCommand } from '../application/commands/delete-user.command';
import { GetUserQuery } from '../application/queries/get-user.query';
import { ListUsersQuery } from '../application/queries/list-users.query';
import { CreateUserCommandAdapter } from './create-user-command.adapter';
import { UpdateUserCommandAdapter } from './update-user-command.adapter';
import { UserDtoAdapter } from './user-dto.adapter';

@Controller()
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly createUserCommandAdapter: CreateUserCommandAdapter,
    private readonly updateUserCommandAdapter: UpdateUserCommandAdapter,
    private readonly userDtoAdapter: UserDtoAdapter,
  ) {}

  @TsRestHandler(userContract.createUser, { validateResponses: true })
  create() {
    return tsRestHandler(userContract.createUser, async ({ body }) => {
      try {
        const user = await this.commandBus.execute(
          this.createUserCommandAdapter.adapt(body),
        );
        return {
          status: 201 as const,
          body: this.userDtoAdapter.adaptFromAggregate(user),
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          return {
            status: 409 as const,
            body: { message: error.message },
          };
        }
        return {
          status: 400 as const,
          body: { message: 'Bad request' },
        };
      }
    });
  }

  @TsRestHandler(userContract.getUser, { validateResponses: true })
  get() {
    return tsRestHandler(userContract.getUser, async ({ params }) => {
      try {
        const readModel = await this.queryBus.execute(
          new GetUserQuery(params.id),
        );
        return {
          status: 200 as const,
          body: this.userDtoAdapter.adaptFromReadModel(readModel),
        };
      } catch (error) {
        if (error instanceof NotFoundException) {
          return {
            status: 404 as const,
            body: { message: 'User not found' },
          };
        }
        return {
          status: 404 as const,
          body: { message: 'User not found' },
        };
      }
    });
  }

  @TsRestHandler(userContract.listUsers, { validateResponses: true })
  list() {
    return tsRestHandler(userContract.listUsers, async () => {
      const readModels = await this.queryBus.execute<
        ListUsersQuery,
        UserReadModel[]
      >(new ListUsersQuery());
      return {
        status: 200 as const,
        body: readModels.map((model) =>
          this.userDtoAdapter.adaptFromReadModel(model),
        ),
      };
    });
  }

  @TsRestHandler(userContract.updateUser, { validateResponses: true })
  update() {
    return tsRestHandler(userContract.updateUser, async ({ params, body }) => {
      try {
        const user = await this.commandBus.execute(
          this.updateUserCommandAdapter.adapt(params.id, body),
        );
        return {
          status: 200 as const,
          body: this.userDtoAdapter.adaptFromAggregate(user),
        };
      } catch (error) {
        if (error instanceof NotFoundException) {
          return {
            status: 404 as const,
            body: { message: 'User not found' },
          };
        }
        return {
          status: 400 as const,
          body: { message: 'Bad request' },
        };
      }
    });
  }

  @TsRestHandler(userContract.deleteUser, { validateResponses: true })
  delete() {
    return tsRestHandler(userContract.deleteUser, async ({ params }) => {
      try {
        await this.commandBus.execute(new DeleteUserCommand(params.id));
        return {
          status: 204 as const,
          body: null,
        };
      } catch (error) {
        if (error instanceof NotFoundException) {
          return {
            status: 404 as const,
            body: { message: 'User not found' },
          };
        }
        return {
          status: 400 as const,
          body: { message: 'Bad request' },
        };
      }
    });
  }
}
