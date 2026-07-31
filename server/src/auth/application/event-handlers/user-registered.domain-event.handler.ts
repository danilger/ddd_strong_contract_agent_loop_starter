import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserRegisteredDomainEvent } from '../../domain/events/user-registered.domain-event';

/** Логирует регистрацию (заглушка побочных эффектов) */
@Injectable()
@EventsHandler(UserRegisteredDomainEvent)
export class UserRegisteredDomainEventHandler implements IEventHandler<UserRegisteredDomainEvent> {
  /**
   * Обрабатывает факт регистрации пользователя.
   */
  handle(event: UserRegisteredDomainEvent): void {
    void event;
  }
}
