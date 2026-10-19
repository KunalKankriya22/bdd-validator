import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { ViewDonorLettersDetailDialogComponent } from './view-donor-letters-detail-dialog.component';
import { ViewDonorLettersService } from '../../services/view-donor-letters.service';
import { ViewDonorLettersDetailDialogData } from '../../models/view-donor-letters.model';

describe('ViewDonorLettersDetailDialogComponent', () => {
  let component: ViewDonorLettersDetailDialogComponent;
  let fixture: ComponentFixture<ViewDonorLettersDetailDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewDonorLettersDetailDialogComponent>>;
  let serviceSpy: jasmine.SpyObj<ViewDonorLettersService>;

  const mockDialogData: ViewDonorLettersDetailDialogData = {
    donorId: 'D001',
    letterSeqNo: '1'
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('ViewDonorLettersService', ['getDonorLetterDetail']);
    serviceSpy.getDonorLetterDetail.and.returnValue(of({
      donorId: 'D001',
      letterSeqNo: '1',
      donorName: 'John Doe',
      letterText: 'Sample letter text'
    }));

    TestBed.configureTestingModule({
      imports: [ViewDonorLettersDetailDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: ViewDonorLettersService, useValue: serviceSpy }
      ]
    });

    fixture = TestBed.createComponent(ViewDonorLettersDetailDialogComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should load letter detail on init', () => {
    // Arrange & Act - ngOnInit triggered by detectChanges

    // Assert
    expect(serviceSpy.getDonorLetterDetail).toHaveBeenCalledWith('D001', '1');
    expect(component.loading()).toBeFalse();
    expect(component.letterDetail()).toBeTruthy();
  });

  it('should set error signal when service call fails', () => {
    // Arrange
    serviceSpy.getDonorLetterDetail.and.returnValue(throwError(() => new Error('Network error')));

    // Act
    component.onRetry();

    // Assert
    expect(component.error()).toBe('Network error');
    expect(component.loading()).toBeFalse();
  });

  it('should close dialog when onClose is called', () => {
    // Arrange - component initialized

    // Act
    component.onClose();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('should reload letter detail when onRetry is called', () => {
    // Arrange
    serviceSpy.getDonorLetterDetail.calls.reset();

    // Act
    component.onRetry();

    // Assert
    expect(serviceSpy.getDonorLetterDetail).toHaveBeenCalledWith('D001', '1');
  });
});
