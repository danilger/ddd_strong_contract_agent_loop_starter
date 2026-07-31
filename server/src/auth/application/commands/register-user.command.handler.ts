import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { User } from '../../domain/entities/user.entity';
import { EmailAlreadyExistsError } from '../../domain/errors/auth.errors';
import {
  UNIT_OF_WORK,
  type UnitOfWorkPort,
} from '../../../db/unit-of-work.port';
import {
  PASSWORD_HASHER_PORT,
  type PasswordHasherPort,
} from '../ports/password-hasher.port';
import {
  USER_WRITE_REPOSITORY,
  type UserWriteRepositoryPort,
} from '../ports/user.write.repository.port';
import { RegisterUserCommand } from './register-user.command';

@Injectable()
@CommandHandler(RegisterUserCommand)
export class RegisterUserCommandHandler implements ICommandHandler<
  RegisterUserCommand,
  string
> {
  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: UserWriteRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly eventPublisher: EventPublisher,
  ) {}

  /**
   * Создаёт пользователя и сохраняет в UoW.
   */
  async execute(command: RegisterUserCommand): Promise<string> {
    const existing = await this.userWriteRepository.loadByEmail(command.email);
    if (existing) {
      throw new EmailAlreadyExistsError();
    }

    const passwordHash = await this.passwordHasher.hash(command.password);
    const user = this.eventPublisher.mergeObjectContext(
      User.register(command.email, passwordHash),
    );

    await this.unitOfWork.execute(async () => {
      await this.userWriteRepository.save(user);
    });
    user.commit();
    return user.getId().getValue();
  }
}
