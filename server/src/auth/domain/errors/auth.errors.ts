/** Email уже зарегистрирован */
export class EmailAlreadyExistsError extends Error {
  constructor() {
    super('Email already registered');
    this.name = 'EmailAlreadyExistsError';
  }
}

/** Неверный email или пароль */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

/** Сессия отсутствует или отозвана */
export class SessionInvalidError extends Error {
  constructor() {
    super('Session is invalid');
    this.name = 'SessionInvalidError';
  }
}
