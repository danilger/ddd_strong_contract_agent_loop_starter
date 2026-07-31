import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserDeletedDomainEvent } from '../../domain/events/user-deleted.domain-event';

@Injectable()
@EventsHandler(UserDeletedDomainEvent)
export class UserDeletedDomainEventHandler
  implements IEventHandler<UserDeletedDomainEvent>
{
  private readonly logger = new Logger(UserDeletedDomainEventHandler.name);

  handle(event: UserDeletedDomainEvent): void {
    this.logger.log(`User deleted: id=${event.userId}`);
  }
}
