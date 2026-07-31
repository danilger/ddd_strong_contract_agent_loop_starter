import { Inject, Injectable } from '@nestjs/common';
import {
  CommandHandler,
  EventPublisher,
  ICommandHandler,
} from '@nestjs/cqrs';
import { User } from '../../domain/entities/user.entity';
import {
  USER_WRITE_REPOSITORY,
  UserWriteRepositoryPort,
} from '../ports/user.write.repository.port';
import { CreateUserCommand } from './create-user.command';

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler
  implements ICommandHandler<CreateUserCommand, User>
{
  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: UserWriteRepositoryPort,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const existing = await this.userWriteRepository.loadByEmail(command.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const user = this.eventPublisher.mergeObjectContext(
      User.create(command.name, command.email),
    );
    await this.userWriteRepository.save(user);
    user.commit();
    return user;
  }
}
