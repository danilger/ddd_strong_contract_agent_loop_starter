import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import {
  USER_WRITE_REPOSITORY,
  UserWriteRepositoryPort,
} from '../ports/user.write.repository.port';
import { DeleteUserCommand } from './delete-user.command';

@Injectable()
@CommandHandler(DeleteUserCommand)
export class DeleteUserCommandHandler
  implements ICommandHandler<DeleteUserCommand, void>
{
  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: UserWriteRepositoryPort,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const existing = await this.userWriteRepository.loadById(command.id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const user = this.eventPublisher.mergeObjectContext(existing);
    user.markDeleted();
    await this.userWriteRepository.delete(command.id);
    user.commit();
  }
}
