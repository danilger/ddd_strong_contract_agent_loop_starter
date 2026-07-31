import { Injectable } from '@nestjs/common';
import type { RegisterDto } from '@repo/contract';
import { RegisterUserCommand } from '../application/commands/register-user.command';

/** DTO → RegisterUserCommand */
@Injectable()
export class RegisterUserCommandAdapter {
  /**
   * Адаптирует тело регистрации в команду.
   */
  adapt(body: RegisterDto): RegisterUserCommand {
    return new RegisterUserCommand(body.email, body.password);
  }
}
