import { AggregateRoot } from '@nestjs/cqrs';
import { UserCreatedDomainEvent } from '../events/user-created.domain-event';
import { UserDeletedDomainEvent } from '../events/user-deleted.domain-event';
import { UserNameUpdatedDomainEvent } from '../events/user-name-updated.domain-event';
import { Email } from '../value-objects/email.vo';
import { UserId } from '../value-objects/user-id.vo';

export class User extends AggregateRoot {
  private updatedAt: Date;

  private constructor(
    private readonly id: UserId,
    private name: string,
    private email: Email,
    private readonly createdAt: Date,
  ) {
    super();
    this.updatedAt = createdAt;
  }

  static create(name: string, email: string): User {
    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 chars');
    }

    const userId = new UserId();
    const createdAt = new Date();
    const normalizedName = name.trim();
    const user = new User(
      userId,
      normalizedName,
      new Email(email),
      createdAt,
    );
    user.apply(
      new UserCreatedDomainEvent(
        userId.getValue(),
        normalizedName,
        new Email(email).getValue(),
        createdAt,
      ),
    );
    return user;
  }

  static rehydrate(props: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    const user = new User(
      new UserId(props.id),
      props.name,
      new Email(props.email),
      props.createdAt,
    );
    user.updatedAt = props.updatedAt;
    return user;
  }

  getId(): UserId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): Email {
    return this.email;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  updateName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 chars');
    }
    const normalizedName = name.trim();
    this.name = normalizedName;
    this.updatedAt = new Date();
    this.apply(
      new UserNameUpdatedDomainEvent(
        this.id.getValue(),
        normalizedName,
        this.updatedAt,
      ),
    );
  }

  markDeleted(): void {
    this.apply(
      new UserDeletedDomainEvent(this.id.getValue(), new Date()),
    );
  }

  protected onUserCreatedDomainEvent(_event: UserCreatedDomainEvent): void {
    // Состояние уже задано в create(); обработчик нужен для будущего replay из event store.
  }

  protected onUserNameUpdatedDomainEvent(_event: UserNameUpdatedDomainEvent): void {
    // Состояние уже обновлено в updateName().
  }

  protected onUserDeletedDomainEvent(_event: UserDeletedDomainEvent): void {
    // Физическое удаление выполняет write repository.
  }
}
