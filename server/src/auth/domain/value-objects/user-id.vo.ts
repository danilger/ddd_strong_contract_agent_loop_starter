import { randomUUID } from 'crypto';

/** Opaque identity id */
export class UserId {
  private readonly value: string;

  constructor(value?: string) {
    this.value = value ?? randomUUID();
  }

  /** Строковое значение id */
  getValue(): string {
    return this.value;
  }
}
