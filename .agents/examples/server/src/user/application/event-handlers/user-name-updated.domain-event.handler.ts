import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserNameUpdatedDomainEvent } from '../../domain/events/user-name-updated.domain-event';

@Injectable()
@EventsHandler(UserNameUpdatedDomainEvent)
export class UserNameUpdatedDomainEventHandler
  implements IEventHandler<UserNameUpdatedDomainEvent>
{
  private readonly logger = new Logger(UserNameUpdatedDomainEventHandler.name);

  handle(event: UserNameUpdatedDomainEvent): void {
    this.logger.log(
      `User name updated: id=${event.userId}, name="${event.name}"`,
    );
  }
}
