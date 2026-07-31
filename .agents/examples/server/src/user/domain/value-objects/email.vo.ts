export class Email {
  constructor(private readonly value: string) {
    if (!value.includes('@')) {
      throw new Error('Invalid email');
    }
  }

  getValue(): string {
    return this.value;
  }
}
