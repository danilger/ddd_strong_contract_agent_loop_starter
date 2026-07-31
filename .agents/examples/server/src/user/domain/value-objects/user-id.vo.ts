import { randomUUID } from 'crypto';

export class UserId {
  constructor(private readonly value: string = randomUUID()) {}

  getValue(): string {
    return this.value;
  }
}
