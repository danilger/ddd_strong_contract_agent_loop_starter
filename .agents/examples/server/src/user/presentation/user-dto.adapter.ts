import { Injectable } from '@nestjs/common';
import { UserDto } from '@repo/contract';
import { UserReadModel } from '../application/ports/user.read.repository.port';
import { User } from '../domain/entities/user.entity';

@Injectable()
export class UserDtoAdapter {
  adaptFromAggregate(user: User): UserDto {
    return {
      id: user.getId().getValue(),
      name: user.getName(),
      email: user.getEmail().getValue(),
      createdAt: user.getCreatedAt().toISOString(),
      updatedAt: user.getUpdatedAt().toISOString(),
    };
  }

  adaptFromReadModel(readModel: UserReadModel): UserDto {
    return {
      id: readModel.id,
      name: readModel.name,
      email: readModel.email,
      createdAt: readModel.createdAt,
      updatedAt: readModel.updatedAt,
    };
  }
}
