import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ViewDirectionComponent, ViewDirectionData } from './view-direction';

describe('ViewDirectionComponent', () => {
  let component: ViewDirectionComponent;
  let fixture: ComponentFixture<ViewDirectionComponent>;

  // -------------------------------------------------------------------------
  // Without dialog (panel mode)
  // -------------------------------------------------------------------------
  describe('without dialog data', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ViewDirectionComponent, NoopAnimationsModule],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: null },
          { provide: MatDialogRef, useValue: null }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(ViewDirectionComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values when no dialog data', () => {
      expect(component.locationId).toBe('');
      expect(component.locationName).toBe('');
      expect(component.directions).toBe('');
    });

    it('should emit closePanel when dialogRef is null', () => {
      const emitSpy = spyOn(component.closePanel, 'emit');
      component.onClose();
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should complete destroy$ on ngOnDestroy', () => {
      const destroy$ = (component as any).destroy$;
      const nextSpy = spyOn(destroy$, 'next').and.callThrough();
      const completeSpy = spyOn(destroy$, 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // With dialog data (modal mode)
  // -------------------------------------------------------------------------
  describe('with dialog data', () => {
    const dialogData: ViewDirectionData = {
      locationId: 'LOC001',
      locationName: 'Main Facility',
      directions: 'Turn left at the intersection'
    };
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<ViewDirectionComponent>>;

    beforeEach(async () => {
      mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

      await TestBed.configureTestingModule({
        imports: [ViewDirectionComponent, NoopAnimationsModule],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: dialogData },
          { provide: MatDialogRef, useValue: mockDialogRef }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(ViewDirectionComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should populate inputs from dialog data', () => {
      expect(component.locationId).toBe('LOC001');
      expect(component.locationName).toBe('Main Facility');
      expect(component.directions).toBe('Turn left at the intersection');
    });

    it('should call dialogRef.close() on onClose() when dialogRef is provided', () => {
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});
