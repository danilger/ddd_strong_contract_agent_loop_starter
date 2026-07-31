import { AggregateRoot } from '@nestjs/cqrs';
import { UserRegisteredDomainEvent } from '../events/user-registered.domain-event';
import { Email } from '../value-objects/email.vo';
import { UserId } from '../value-objects/user-id.vo';

/** Identity-агрегат: credentials без ролей */
export class User extends AggregateRoot {
  private updatedAt: Date;

  private constructor(
    private readonly id: UserId,
    private readonly email: Email,
    private passwordHash: string,
    private readonly createdAt: Date,
  ) {
    super();
    this.updatedAt = createdAt;
  }

  /**
   * Регистрирует нового пользователя по email и hash пароля.
   */
  static register(email: string, passwordHash: string): User {
    if (!passwordHash) {
      throw new Error('Password hash is required');
    }
    const userId = new UserId();
    const createdAt = new Date();
    const emailVo = new Email(email);
    const user = new User(userId, emailVo, passwordHash, createdAt);
    user.apply(
      new UserRegisteredDomainEvent(
        userId.getValue(),
        emailVo.getValue(),
        createdAt,
      ),
    );
    return user;
  }

  /**
   * Восстанавливает агрегат из persistence.
   */
  static rehydrate(props: {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    const user = new User(
      new UserId(props.id),
      new Email(props.email),
      props.passwordHash,
      props.createdAt,
    );
    user.updatedAt = props.updatedAt;
    return user;
  }

  getId(): UserId {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
