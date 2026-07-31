import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from '@repo/contract';
import { UpdateUserCommand } from '../application/commands/update-user.command';

@Injectable()
export class UpdateUserCommandAdapter {
  adapt(id: string, dto: UpdateUserDto): UpdateUserCommand {
    return new UpdateUserCommand(id, dto.name);
  }
}
