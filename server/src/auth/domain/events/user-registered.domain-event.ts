/** Пользователь зарегистрирован */
export class UserRegisteredDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly occurredAt: Date,
  ) {}
}
