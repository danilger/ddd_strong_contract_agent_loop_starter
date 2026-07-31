import { Command } from '@nestjs/cqrs';

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
};

/** Команда входа */
export class LoginCommand extends Command<LoginResult> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
