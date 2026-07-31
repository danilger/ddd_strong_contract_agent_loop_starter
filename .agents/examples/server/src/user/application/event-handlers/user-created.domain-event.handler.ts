import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserCreatedDomainEvent } from '../../domain/events/user-created.domain-event';

@Injectable()
@EventsHandler(UserCreatedDomainEvent)
export class UserCreatedDomainEventHandler
  implements IEventHandler<UserCreatedDomainEvent>
{
  private readonly logger = new Logger(UserCreatedDomainEventHandler.name);

  handle(event: UserCreatedDomainEvent): void {
    this.logger.log(
      `User created: id=${event.userId}, email="${event.email}"`,
    );
  }
}
