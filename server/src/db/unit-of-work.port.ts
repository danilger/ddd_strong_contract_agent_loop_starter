/** Порт Unit of Work для транзакций write-handler'ов */
export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');

export interface UnitOfWorkPort {
  /**
   * Выполняет callback в одной транзакции SQLite.
   */
  execute<T>(work: () => Promise<T> | T): Promise<T>;
}
