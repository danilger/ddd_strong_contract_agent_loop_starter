import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { UpdateUserCommand } from './update-user.command';

@Injectable()
@CommandHandler(UpdateUserCommand)
export class UpdateUserCommandHandler
  implements ICommandHandler<UpdateUserCommand, User>
{
  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: UserWriteRepositoryPort,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const existing = await this.userWriteRepository.loadById(command.id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const user = this.eventPublisher.mergeObjectContext(existing);
    user.updateName(command.name);
    await this.userWriteRepository.save(user);
    user.commit();
    return user;
  }
}
