export class UserDeletedDomainEvent {
  constructor(
    readonly userId: string,
    readonly occurredAt: Date,
  ) {}
}
