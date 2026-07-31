export class UserNameUpdatedDomainEvent {
  constructor(
    readonly userId: string,
    readonly name: string,
    readonly occurredAt: Date,
  ) {}
}
