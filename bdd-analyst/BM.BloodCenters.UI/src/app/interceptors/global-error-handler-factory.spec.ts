import { Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { globalErrorHandlerFactory } from './global-error-handler-factory';
import { SnackbarService } from '../shared/services/snackbar.service';

describe('globalErrorHandlerFactory', () => {
  let errorHandler: { handleError: (error: any) => void };
  let snackbarService: jest.Mocked<SnackbarService>;
  let injector: jest.Mocked<Injector>;

  beforeEach(() => {
    snackbarService = {
      showError: jest.fn(),
    } as any;

    injector = {
      get: jest.fn().mockReturnValue(snackbarService),
    } as any;

    errorHandler = globalErrorHandlerFactory(injector);

    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sessionStorage.removeItem('chunk-load-error-reload');
  });

  it('should create an ErrorHandler', () => {
    expect(errorHandler).toBeDefined();
    expect(errorHandler.handleError).toBeDefined();
  });

  describe('HTTP errors', () => {
    it('should log server error message without showing snackbar', () => {
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        error: { message: 'Server failure' },
      });

      errorHandler.handleError(httpError);

      expect(console.log).toHaveBeenCalledWith('Server Error (fallback):', expect.any(String));
      expect(snackbarService.showError).not.toHaveBeenCalled();
    });
  });

  describe('client errors', () => {
    it('should show snackbar for regular client errors', () => {
      const error = new Error('Something broke');
      errorHandler.handleError(error);
      expect(snackbarService.showError).toHaveBeenCalledWith('Something broke');
    });

    it('should use default message when error has no message', () => {
      const error = new Error();
      error.message = '';
      errorHandler.handleError(error);
      expect(snackbarService.showError).toHaveBeenCalledWith('Client error occurred.');
    });
  });

  describe('chunk load errors', () => {
    it('should show error snackbar on repeated chunk load error', () => {
      sessionStorage.setItem('chunk-load-error-reload', 'true');
      const error = new Error('Loading chunk failed');
      errorHandler.handleError(error);

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Failed to load module. Please clear your browser cache and try again.'
      );
      expect(sessionStorage.getItem('chunk-load-error-reload')).toBeNull();
    });

    it('should detect chunk load error from message keywords', () => {
      sessionStorage.setItem('chunk-load-error-reload', 'true');
      const error = new Error('Failed to fetch dynamically imported module /chunk-abc123.js');
      errorHandler.handleError(error);
      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Failed to load module. Please clear your browser cache and try again.'
      );
    });

    it('should detect chunk load error from name', () => {
      sessionStorage.setItem('chunk-load-error-reload', 'true');
      const error = new Error('Network error');
      error.name = 'ChunkLoadError';
      errorHandler.handleError(error);
      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Failed to load module. Please clear your browser cache and try again.'
      );
    });
  });
});
