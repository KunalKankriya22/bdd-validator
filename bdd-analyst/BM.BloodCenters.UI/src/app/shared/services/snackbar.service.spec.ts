import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarService } from './snackbar.service';
import { Subject } from 'rxjs';

describe('SnackbarService', () => {
  let service: SnackbarService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let mockSnackBarRef: jasmine.SpyObj<any>;
  let actionSubject: Subject<void>;

  beforeEach(() => {
    actionSubject = new Subject<void>();

    mockSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
    mockSnackBarRef.onAction.and.returnValue(actionSubject.asObservable());

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open', 'dismiss']);
    snackBarSpy.open.and.returnValue(mockSnackBarRef);

    TestBed.configureTestingModule({
      providers: [
        SnackbarService,
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    service = TestBed.inject(SnackbarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showSuccess', () => {
    it('should dismiss existing snackbar and open a success snackbar with default action', () => {
      service.showSuccess('Saved successfully');

      expect(snackBarSpy.dismiss).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Saved successfully',
        'DISMISS',
        expect.objectContaining({
          duration: 8000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'end',
          verticalPosition: 'top',
        })
      );
    });

    it('should use custom action text when provided', () => {
      service.showSuccess('Done', 'OK');

      expect(snackBarSpy.open).toHaveBeenCalledWith('Done', 'OK', expect.any(Object));
    });

    it('should dismiss snackbar when onAction is triggered', () => {
      service.showSuccess('Saved successfully');

      actionSubject.next();

      expect(mockSnackBarRef.dismiss).toHaveBeenCalled();
    });

    it('should subscribe to onAction of the opened snackbar', () => {
      service.showSuccess('Test message');

      expect(mockSnackBarRef.onAction).toHaveBeenCalled();
    });
  });

  describe('showError', () => {
    it('should dismiss existing snackbar and open an error snackbar with defaults', () => {
      service.showError('Something went wrong');

      expect(snackBarSpy.dismiss).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Something went wrong',
        'DISMISS',
        expect.objectContaining({
          duration: 0,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'end',
          verticalPosition: 'top',
        })
      );
    });

    it('should use custom action text when provided', () => {
      service.showError('Error occurred', 'CLOSE');

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error occurred',
        'CLOSE',
        expect.objectContaining({ duration: 0 })
      );
    });

    it('should use custom duration when provided', () => {
      service.showError('Error', 'DISMISS', 5000);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error',
        'DISMISS',
        expect.objectContaining({ duration: 5000 })
      );
    });

    it('should use both custom action and custom duration', () => {
      service.showError('Fail', 'RETRY', 3000);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Fail',
        'RETRY',
        expect.objectContaining({ duration: 3000 })
      );
    });

    it('should dismiss snackbar when onAction is triggered', () => {
      service.showError('Something went wrong');

      actionSubject.next();

      expect(mockSnackBarRef.dismiss).toHaveBeenCalled();
    });

    it('should subscribe to onAction of the opened snackbar', () => {
      service.showError('Error message');

      expect(mockSnackBarRef.onAction).toHaveBeenCalled();
    });
  });

  describe('showInfo', () => {
    it('should dismiss existing snackbar and open an info snackbar with defaults', () => {
      service.showInfo('FYI');

      expect(snackBarSpy.dismiss).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'FYI',
        'DISMISS',
        expect.objectContaining({
          duration: 8000,
          panelClass: ['info-snackbar'],
          horizontalPosition: 'end',
          verticalPosition: 'top',
        })
      );
    });

    it('should use custom action text when provided', () => {
      service.showInfo('Information', 'GOT IT');

      expect(snackBarSpy.open).toHaveBeenCalledWith('Information', 'GOT IT', expect.any(Object));
    });

    it('should dismiss snackbar when onAction is triggered', () => {
      service.showInfo('FYI');

      actionSubject.next();

      expect(mockSnackBarRef.dismiss).toHaveBeenCalled();
    });

    it('should subscribe to onAction of the opened snackbar', () => {
      service.showInfo('Info message');

      expect(mockSnackBarRef.onAction).toHaveBeenCalled();
    });
  });
});
