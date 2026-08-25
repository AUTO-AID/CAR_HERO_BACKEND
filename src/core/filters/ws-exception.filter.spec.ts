import { ForbiddenException, NotFoundException, ArgumentsHost } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { WsExceptionFilter } from './ws-exception.filter';

/**
 * انحدار: رفض البوّابة كان يختفي تماماً.
 *
 * سلوك Nest الافتراضي لا يستدعي ack عند رمي المعالِج، فكان العميل ينتظر
 * مهلته (١٢ ثانية) ثم يعرض «انتهت مهلة الإرسال» بدل السبب. وأشدّ منه أن
 * `ChatService` يرمي استثناءات HTTP داخل WS فتتحوّل إلى «Internal server
 * error». هذه الاختبارات تحرس الشكل الذي يفحصه العميلان: `success:false`
 * ورسالةٌ مفهومة، عبر الـ ack إن وُجد.
 */
describe('WsExceptionFilter', () => {
  const hostWith = (client: any, ack?: any): ArgumentsHost => ({
    switchToWs: () => ({ getClient: () => client, getData: () => ({}) }),
    getArgByIndex: (i: number) => (i === 2 ? ack : undefined),
  }) as any;

  let filter: WsExceptionFilter;
  let client: any;
  let ack: jest.Mock;

  beforeEach(() => {
    filter = new WsExceptionFilter();
    client = { id: 'sock-1', emit: jest.fn() };
    ack = jest.fn();
  });

  it('يردّ رسالة WsException في الـ ack', () => {
    filter.catch(new WsException('Unauthorized: You are not a participant of this chat'), hostWith(client, ack));

    expect(ack).toHaveBeenCalledWith({
      success: false,
      message: 'Unauthorized: You are not a participant of this chat',
    });
    expect(client.emit).not.toHaveBeenCalled();
  });

  it('يحافظ على رسالة استثناءات HTTP التي يرميها ChatService', () => {
    filter.catch(new ForbiddenException('Not a participant of this chat'), hostWith(client, ack));
    expect(ack).toHaveBeenCalledWith({ success: false, message: 'Not a participant of this chat' });

    ack.mockClear();
    filter.catch(new NotFoundException('Chat not found'), hostWith(client, ack));
    expect(ack).toHaveBeenCalledWith({ success: false, message: 'Chat not found' });
  });

  it('يبثّ exception حين يرسل العميل بلا ack', () => {
    filter.catch(new WsException('nope'), hostWith(client, undefined));

    expect(client.emit).toHaveBeenCalledWith('exception', { success: false, message: 'nope' });
  });

  it('لا يُسرّب تفاصيل الأخطاء غير المتوقّعة', () => {
    filter.catch(new Error('connect ECONNREFUSED 10.0.0.5:27017'), hostWith(client, ack));

    expect(ack).toHaveBeenCalledWith({ success: false, message: 'حدث خطأ غير متوقّع' });
  });
});
