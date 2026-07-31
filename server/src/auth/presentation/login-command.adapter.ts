import { Injectable } from '@nestjs/common';
import type { LoginDto } from '@repo/contract';
import { LoginCommand } from '../application/commands/login.command';

/** DTO → LoginCommand */
@Injectable()
export class LoginCommandAdapter {
  /**
   * Адаптирует тело login в команду.
   */
  adapt(body: LoginDto): LoginCommand {
    return new LoginCommand(body.email, body.password);
  }
}
