import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '@repo/contract';
import { CreateUserCommand } from '../application/commands/create-user.command';

@Injectable()
export class CreateUserCommandAdapter {
  adapt(dto: CreateUserDto): CreateUserCommand {
    return new CreateUserCommand(dto.name, dto.email);
  }
}
