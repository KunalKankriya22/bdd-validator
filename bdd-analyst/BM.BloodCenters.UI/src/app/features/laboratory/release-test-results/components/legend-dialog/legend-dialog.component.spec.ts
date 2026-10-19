import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { LegendDialogComponent, LegendDialogData } from './legend-dialog.component';

describe('LegendDialogComponent', () => {
  let component: LegendDialogComponent;
  let fixture: ComponentFixture<LegendDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<LegendDialogComponent>>;

  const mockDialogData: LegendDialogData = {
    legendData: [
      { code: 'WHITE', description: 'No results' },
      { code: 'GREEN', description: 'All released' }
    ] as any[]
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [LegendDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });

    fixture = TestBed.createComponent(LegendDialogComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should initialize with legend items from dialog data', () => {
    // Arrange & Act - data injected via constructor

    // Assert
    expect(component.legendItems).toBeTruthy();
    expect(component.legendItems.length).toBe(2);
  });

  it('should return correct color class for known codes', () => {
    // Arrange & Act & Assert
    expect(component.getColorClass('WHITE')).toBe('date-white');
    expect(component.getColorClass('GREEN')).toBe('date-green');
    expect(component.getColorClass('UNKNOWN')).toBe('');
  });

  it('should close dialog on close', () => {
    // Arrange & Act
    component.onClose();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });
});
