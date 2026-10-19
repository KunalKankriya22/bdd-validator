import { LoggingService } from './logging.service';

describe('LoggingService', () => {
  let service: LoggingService;

  beforeEach(() => {
    service = new LoggingService();
    spyOn(console, 'log').and.callFake(() => {});
    spyOn(console, 'error').and.callFake(() => {});
    spyOn(console, 'warn').and.callFake(() => {});
    spyOn(console, 'debug').and.callFake(() => {});
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('log', () => {
    it('should call console.log with message only', () => {
      service.log('test message');

      expect(console.log).toHaveBeenCalledWith('test message', undefined);
    });

    it('should call console.log with message and data', () => {
      const data = { key: 'value' };

      service.log('test message', data);

      expect(console.log).toHaveBeenCalledWith('test message', data);
    });
  });

  describe('error', () => {
    it('should call console.error with message only', () => {
      service.error('error message');

      expect(console.error).toHaveBeenCalledWith('error message', undefined);
    });

    it('should call console.error with message and error object', () => {
      const err = new Error('test');

      service.error('error message', err);

      expect(console.error).toHaveBeenCalledWith('error message', err);
    });
  });

  describe('warn', () => {
    it('should call console.warn with message only', () => {
      service.warn('warning message');

      expect(console.warn).toHaveBeenCalledWith('warning message', undefined);
    });

    it('should call console.warn with message and data', () => {
      const data = { detail: 'info' };

      service.warn('warning', data);

      expect(console.warn).toHaveBeenCalledWith('warning', data);
    });
  });

  describe('debug', () => {
    it('should call console.debug in non-production mode', () => {
      service.debug('debug message');

      expect(console.debug).toHaveBeenCalledWith('debug message', undefined);
    });

    it('should call console.debug with data in non-production mode', () => {
      service.debug('debug', { x: 1 });

      expect(console.debug).toHaveBeenCalledWith('debug', { x: 1 });
    });

    it('should NOT call console.debug when in production mode', () => {
      // Arrange: override private isProduction to return true
      spyOn(service as any, 'isProduction').and.returnValue(true);
      (console.debug as jasmine.Spy).calls.reset();

      // Act
      service.debug('debug message');

      // Assert
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should NOT call console.debug with data when in production mode', () => {
      // Arrange
      spyOn(service as any, 'isProduction').and.returnValue(true);
      (console.debug as jasmine.Spy).calls.reset();

      // Act
      service.debug('debug', { x: 1 });

      // Assert
      expect(console.debug).not.toHaveBeenCalled();
    });
  });
});
