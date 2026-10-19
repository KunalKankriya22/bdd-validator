import { NotificationService, NotificationType, Notification } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showSuccess', () => {
    it('should emit a success notification', (done) => {
      service.notification$.subscribe((notification: Notification) => {
        expect(notification.type).toBe(NotificationType.SUCCESS);
        expect(notification.message).toBe('Success!');
        expect(notification.duration).toBe(3000);
        done();
      });
      service.showSuccess('Success!');
    });

    it('should use custom duration', (done) => {
      service.notification$.subscribe((notification: Notification) => {
        expect(notification.duration).toBe(5000);
        done();
      });
      service.showSuccess('Success!', 5000);
    });
  });

  describe('showError', () => {
    it('should emit an error notification with 5000ms default duration', (done) => {
      service.notification$.subscribe((notification: Notification) => {
        expect(notification.type).toBe(NotificationType.ERROR);
        expect(notification.message).toBe('Error occurred');
        expect(notification.duration).toBe(5000);
        done();
      });
      service.showError('Error occurred');
    });
  });

  describe('showWarning', () => {
    it('should emit a warning notification with 4000ms default duration', (done) => {
      service.notification$.subscribe((notification: Notification) => {
        expect(notification.type).toBe(NotificationType.WARNING);
        expect(notification.message).toBe('Warning!');
        expect(notification.duration).toBe(4000);
        done();
      });
      service.showWarning('Warning!');
    });
  });

  describe('showInfo', () => {
    it('should emit an info notification with 3000ms default duration', (done) => {
      service.notification$.subscribe((notification: Notification) => {
        expect(notification.type).toBe(NotificationType.INFO);
        expect(notification.message).toBe('Info message');
        expect(notification.duration).toBe(3000);
        done();
      });
      service.showInfo('Info message');
    });
  });

  describe('NotificationType enum', () => {
    it('should have correct values', () => {
      expect(NotificationType.SUCCESS).toBe('success');
      expect(NotificationType.ERROR).toBe('error');
      expect(NotificationType.WARNING).toBe('warning');
      expect(NotificationType.INFO).toBe('info');
    });
  });
});
