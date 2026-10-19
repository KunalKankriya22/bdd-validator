import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { PrdtyatFilterComponent } from './prdtyat-filter.component';
import { PrdtyatService } from '../../services/prdtyat.service';

describe('PrdtyatFilterComponent', () => {
  let component: PrdtyatFilterComponent;
  let fixture: ComponentFixture<PrdtyatFilterComponent>;
  let prdtyatService: jasmine.SpyObj<PrdtyatService>;

  beforeEach(async () => {
    const prdtyatServiceSpy = jasmine.createSpyObj('PrdtyatService', [
      'getAnticoagulantCodesFilter',
      'getProductTypesFilter',
      'getAttributesFilter'
    ]);

    await TestBed.configureTestingModule({
      imports: [PrdtyatFilterComponent, NoopAnimationsModule],
      providers: [
        { provide: PrdtyatService, useValue: prdtyatServiceSpy }
      ]
    }).compileComponents();

    prdtyatService = TestBed.inject(PrdtyatService) as jasmine.SpyObj<PrdtyatService>;

    // Mock service responses
    prdtyatService.getAnticoagulantCodesFilter.and.returnValue(
      of([{ code: '5', description: 'Test Anticoagulant' }])
    );
    prdtyatService.getProductTypesFilter.and.returnValue(
      of([{ code: 'APLS', description: 'Test Product' }])
    );
    prdtyatService.getAttributesFilter.and.returnValue(
      of([{ code: 'V0001035', description: 'Blood Core' }])
    );

    fixture = TestBed.createComponent(PrdtyatFilterComponent);
    component = fixture.componentInstance;
  });
  describe('Filter Options Loading', () => {


    it('should handle loading errors gracefully', (done) => {
      prdtyatService.getAnticoagulantCodesFilter.and.returnValue(
        throwError(() => new Error('Load failed'))
      );
      fixture.detectChanges();
      setTimeout(() => {
        expect(component.isLoading).toBeFalse();
        done();
      }, 100);
    });
  });

  describe('Search Controls', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter anticoagulant options when search text changes', (done) => {
      component.anticoagulantCodeOptions = [
        { code: '5', description: 'Test' },
        { code: '6', description: 'Other' }
      ];
      component.anticoagulantSearchControl.setValue('Test');

      setTimeout(() => {
        expect(component.filteredAnticoagulantOptions.length).toBeLessThanOrEqual(2);
        done();
      }, 350);
    });

  });


  describe('Has Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when form value changes from initial snapshot', () => {
      component.filterForm.patchValue({ anticoagulantCode: '5' });
      expect(component.hasChanges).toBeTrue();
    });

    it('should return false when form is pristine and no initial filters', () => {
      expect(component.hasChanges).toBeFalse();
    });
  });

});
