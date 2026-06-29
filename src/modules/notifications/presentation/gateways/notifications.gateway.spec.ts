import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsGateway', () => {
  it('joins the normalized user room when the token payload has userId', () => {
    const gateway = new NotificationsGateway();
    const client: any = {
      id: 'socket-1',
      data: { user: { userId: 'admin-123' } },
      join: jest.fn(),
    };

    const result = gateway.handleJoinNotifications(client);

    expect(client.join).toHaveBeenCalledWith('user_admin-123');
    expect(result).toEqual({ success: true, room: 'user_admin-123' });
  });

  it('falls back to id when joining notification rooms', () => {
    const gateway = new NotificationsGateway();
    const client: any = {
      id: 'socket-2',
      data: { user: { id: 'user-456' } },
      join: jest.fn(),
    };

    const result = gateway.handleJoinNotifications(client);

    expect(client.join).toHaveBeenCalledWith('user_user-456');
    expect(result).toEqual({ success: true, room: 'user_user-456' });
  });
});
