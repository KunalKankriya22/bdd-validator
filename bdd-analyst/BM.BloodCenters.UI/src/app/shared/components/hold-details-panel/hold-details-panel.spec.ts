import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';

import { HoldDetailsPanelComponent } from './hold-details-panel';
import { ReleaseAuditHoldsService } from 'src/app/modules/donor-functions/registration/registration-maintenance-functions/release-audit-holds/services/release-audit-holds.service';
import { HeaderService } from '@shared/services/header.service';
import { HoldDetailsPanelRecord } from './hold-details-panel.model';

describe('HoldDetailsPanelComponent', () => {
  let component: HoldDetailsPanelComponent;
  let fixture: ComponentFixture<HoldDetailsPanelComponent>;
  let mockService: jasmine.SpyObj<ReleaseAuditHoldsService>;
  let mockHeaderService: { chapterChanged$: Subject<void> };
  let mockOverlay: jasmine.SpyObj<Overlay>;

  const mockRecord: HoldDetailsPanelRecord = {
    transactionId: 'TXN001',
    donorId: 'DON001',
    unitId: 'UNIT001',
    collectionDate: '2025-01-15',
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ReleaseAuditHoldsService', [
      'getUnitHolds',
      'getDonorHolds',
    ]);
    mockService.getUnitHolds.and.returnValue(of([]));
    mockService.getDonorHolds.and.returnValue(of([]));

    mockHeaderService = {
      chapterChanged$: new Subject<void>(),
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position']);



      TestBed.configureTestingModule({
      imports: [HoldDetailsPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: ReleaseAuditHoldsService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: Overlay, useValue: mockOverlay },
      ],
    });


    


      mockService.getUnitHolds.calls.reset();


      mockService.getDonorHolds.calls.reset();


      mockOverlay.create.calls.reset();


      mockOverlay.position.calls.reset();


      mockService.getUnitHolds.and.returnValue(of([]));


      mockService.getDonorHolds.and.returnValue(of([]));


    fixture = TestBed.createComponent(HoldDetailsPanelComponent);
    component = fixture.componentInstance;


    });
  describe('Record Input Validation (H2)', () => {
    it('should emit closePanel and return early when record is not provided', () => {
      spyOn(component.closePanel, 'emit');
      fixture.detectChanges();

      expect(component.closePanel.emit).toHaveBeenCalled();
      expect(mockService.getUnitHolds).not.toHaveBeenCalled();
      expect(mockService.getDonorHolds).not.toHaveBeenCalled();
    });

    it('should proceed normally when record is provided', () => {
      component.record = mockRecord;
      fixture.detectChanges();

      expect(mockService.getUnitHolds).toHaveBeenCalled();
      expect(mockService.getDonorHolds).toHaveBeenCalled();
    });
  });

  describe('Load Hold Details', () => {
    beforeEach(() => {
      component.record = mockRecord;
    });

    it('should load unit holds and donor holds on init', () => {
      fixture.detectChanges();
      expect(mockService.getUnitHolds).toHaveBeenCalled();
      expect(mockService.getDonorHolds).toHaveBeenCalled();
    });

    it('should handle unit holds error gracefully', () => {
      mockService.getUnitHolds.and.returnValue(throwError(() => ({ error: { message: 'Failed' } })));
      fixture.detectChanges();

      expect(component.hasUnitHoldsError).toBeTrue();
      expect(component.isLoadingUnitHolds).toBeFalse();
    });

    it('should handle donor holds error gracefully', () => {
      mockService.getDonorHolds.and.returnValue(throwError(() => ({ error: { message: 'Failed' } })));
      fixture.detectChanges();

      expect(component.hasDonorHoldsError).toBeTrue();
      expect(component.isLoadingDonorHolds).toBeFalse();
    });

    it('should populate filteredUnitHolds on success', fakeAsync(() => {
      const mockHolds = [{ type: 'A', code: 'H1', description: 'Hold 1' }];
      mockService.getUnitHolds.and.returnValue(of(mockHolds as any));
      fixture.detectChanges();
      tick();

      expect(component.filteredUnitHolds).toEqual(mockHolds as any);
    }));
  });

  describe('Overlay Memory Leak Prevention (H3)', () => {
    beforeEach(() => {
      component.record = mockRecord;
      fixture.detectChanges();
    });



    it('should not attempt dispose when no overlay exists', () => {
      (component as any).overlayRef = null;
      expect(() => component.onFilterClick('unit')).not.toThrow();
    });
  });





  describe('Filter Chips', () => {
    beforeEach(() => {
      component.record = mockRecord;
      fixture.detectChanges();
    });

    it('should clear unit filters and reload', () => {
      component.unitHoldsFilters = { holds: 'Active' };
      component.unitFilterChips = [{ key: 'holds', label: 'Holds: Active', value: 'Active' }];
      component.onClearUnitFilters();

      expect(component.unitHoldsFilters).toBeNull();
      expect(component.unitFilterChips).toEqual([]);
      expect(mockService.getUnitHolds).toHaveBeenCalledTimes(2);
    });

    it('should clear donor filters and reload', () => {
      component.donorHoldsFilters = { holds: 'All' };
      component.donorFilterChips = [{ key: 'holds', label: 'Holds: All', value: 'All' }];
      component.onClearDonorFilters();

      expect(component.donorHoldsFilters).toBeNull();
      expect(component.donorFilterChips).toEqual([]);
      expect(mockService.getDonorHolds).toHaveBeenCalledTimes(2);
    });
  });
});
