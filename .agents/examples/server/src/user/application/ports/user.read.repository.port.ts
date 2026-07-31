export interface UserReadModel {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserReadRepositoryPort {
  findById(id: string): Promise<UserReadModel | null>;
  findAll(): Promise<UserReadModel[]>;
}

export const USER_READ_REPOSITORY = Symbol('USER_READ_REPOSITORY');
