/** Read-модель для GET /auth/me */
export type MeReadModel = {
  userId: string;
  email: string;
};

export const USER_READ_REPOSITORY = Symbol('USER_READ_REPOSITORY');

/** Read-порт identity */
export interface UserReadRepositoryPort {
  findById(id: string): Promise<MeReadModel | null>;
}
