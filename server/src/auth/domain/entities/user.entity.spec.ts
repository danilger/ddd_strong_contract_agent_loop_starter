import { User } from './user.entity';

describe('User', () => {
  it('registers with normalized email event', () => {
    const user = User.register('Alice@Example.com', 'hash');
    expect(user.getEmail().getValue()).toBe('alice@example.com');
    expect(user.getPasswordHash()).toBe('hash');
    expect(user.getId().getValue()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
