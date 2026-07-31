import { Command } from '@nestjs/cqrs';

/** Обновление access по refresh */
export class RefreshSessionCommand extends Command<string> {
  constructor(public readonly refreshToken: string) {
    super();
  }
}
