import { Command } from '@nestjs/cqrs';

/** Команда регистрации */
export class RegisterUserCommand extends Command<string> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
