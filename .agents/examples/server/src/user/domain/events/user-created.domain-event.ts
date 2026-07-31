export class UserCreatedDomainEvent {
  constructor(
    readonly userId: string,
    readonly name: string,
    readonly email: string,
    readonly occurredAt: Date,
  ) {}
}
