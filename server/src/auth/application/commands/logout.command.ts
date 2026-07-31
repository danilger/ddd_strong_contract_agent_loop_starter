import { Command } from '@nestjs/cqrs';

/** Выход и отзыв сессии */
export class LogoutCommand extends Command<void> {
  constructor(public readonly refreshToken: string) {
    super();
  }
}
