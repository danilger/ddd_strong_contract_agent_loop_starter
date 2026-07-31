/** Email как login identifier */
export class Email {
  private readonly value: string;

  constructor(raw: string) {
    const normalized = raw.trim().toLowerCase();
    if (!normalized.includes('@')) {
      throw new Error('Invalid email');
    }
    this.value = normalized;
  }

  /** Нормализованный email */
  getValue(): string {
    return this.value;
  }
}
