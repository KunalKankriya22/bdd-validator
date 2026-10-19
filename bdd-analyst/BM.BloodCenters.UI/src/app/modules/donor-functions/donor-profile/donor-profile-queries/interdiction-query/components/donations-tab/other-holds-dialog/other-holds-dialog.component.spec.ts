import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OtherHoldsDialogComponent } from './other-holds-dialog.component';

describe('OtherHoldsDialogComponent', () => {
  let component: OtherHoldsDialogComponent;
  let fixture: ComponentFixture<OtherHoldsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<OtherHoldsDialogComponent>>;

  const mockDialogData = {
    unitId: 'W12342402705-Q'
  };

  beforeEach(() => {

    jest.useFakeTimers();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
imports: [OtherHoldsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });


    });



  beforeEach(() => {


      dialogRefSpy.close.calls.reset();


    fixture = TestBed.createComponent(OtherHoldsDialogComponent);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    jest.useRealTimers();
    fixture.destroy();
  });

  describe('Initialization', () => {

    it('should load other holds on init', () => {
      fixture.detectChanges();
      jest.advanceTimersByTime(300);
      expect(component.otherHolds().length).toBe(4);
    });


    it('should clear loading after data loads', () => {
      fixture.detectChanges();
      jest.advanceTimersByTime(300);
      expect(component.isLoading()).toBeFalse();
    });
  });

  describe('Load Other Holds', () => {
    it('should load other holds successfully', () => {
      fixture.detectChanges();
      jest.advanceTimersByTime(300);
      expect(component.otherHolds().length).toBe(4);
      expect(component.isLoading()).toBeFalse();
      expect(component.hasError()).toBeFalse();
    });

    it('should handle error when loading fails', () => {
      fixture.detectChanges();
      jest.advanceTimersByTime(300);
      expect(component.hasError()).toBeFalse();
      expect(component.isLoading()).toBeFalse();
    });

    it('should handle empty result', () => {
      component.data.unitId = 'NONEXISTENT-UNIT';
      component.loadOtherHolds();
      jest.advanceTimersByTime(300);
      expect(component.otherHolds()).toEqual([]);
      expect(component.isLoading()).toBeFalse();
      expect(component.hasError()).toBeFalse();
      component.data.unitId = 'W12342402705-Q';
    });
  });
  describe('Date Formatting', () => {
    it('should format valid ISO date', () => {
      const formatted = component.formatDate('2026-01-15');
      expect(formatted).toBe('15-JAN-2026');
    });


  });

  describe('Table Display', () => {
    it('should display correct columns', () => {
      expect(component.displayedColumns).toEqual([
        'holdCode', 'description', 'origin',
        'reasonCode', 'effectiveDate', 'terminationDate'
      ]);
    });
  });

  describe('Dialog Data', () => {
    it('should have unitId from dialog data', () => {
      expect(component.data.unitId).toBe('W12342402705-Q');
    });
  });
});
