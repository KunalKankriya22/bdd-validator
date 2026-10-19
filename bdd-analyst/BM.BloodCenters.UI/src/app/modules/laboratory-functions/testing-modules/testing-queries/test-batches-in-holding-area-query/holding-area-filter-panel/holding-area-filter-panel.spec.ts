import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { HoldingAreaFilterPanel } from './holding-area-filter-panel';
import { HoldingTestGridFilter } from '../test-batches-in-holding-area-query.model';

describe('HoldingAreaFilterPanel', () => {
  let component: HoldingAreaFilterPanel;
  let fixture: ComponentFixture<HoldingAreaFilterPanel>;

  const mockFilterOptions = {
    testIds: ['HBSAG', 'ABORH', 'HIVNAT'],
    absorbanceValues: ['0.045', '0.089', '1.2'],
    ratioValues: ['1.0', '2.1', '3.5'],
    resultValues: ['NR', 'R', 'A POS'],
    statusValues: ['Upload', 'Pending'],
  };

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        HoldingAreaFilterPanel,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(HoldingAreaFilterPanel);
    component = fixture.componentInstance;


    });
  describe('Filter Options', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should populate filtered signals when filterOptions is set', () => {
      component.filterOptions = mockFilterOptions;

      expect(component.filteredTestIds()).toEqual(['HBSAG', 'ABORH', 'HIVNAT']);
      expect(component.filteredAbsorbances()).toEqual(['0.045', '0.089', '1.2']);
      expect(component.filteredRatios()).toEqual(['1.0', '2.1', '3.5']);
      expect(component.filteredResultValues()).toEqual(['NR', 'R', 'A POS']);
      expect(component.filteredStatuses()).toEqual(['Upload', 'Pending']);
    });
  });

  describe('Search Filters', () => {
    beforeEach(() => {
      component.filterOptions = mockFilterOptions;
      fixture.detectChanges();
    });


    it('should return all test IDs when search is empty', (done) => {
      component.testIdSearchCtrl.setValue('');
      setTimeout(() => {
        expect(component.filteredTestIds().length).toBe(3);
        done();
      });
    });


    it('should filter ratio values', (done) => {
      component.ratioSearchCtrl.setValue('2.1');
      setTimeout(() => {
        expect(component.filteredRatios().length).toBe(1);
        done();
      });
    });


    it('should filter status values', (done) => {
      component.statusSearchCtrl.setValue('upload');
      setTimeout(() => {
        expect(component.filteredStatuses().length).toBe(1);
        expect(component.filteredStatuses()[0]).toBe('Upload');
        done();
      });
    });
  });



  describe('Clear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls to null', () => {
      component.filterForm.patchValue({
        testId: 'HBSAG',
        absorbance: '0.045',
        ratio: '1.0',
        resultValue: 'NR',
        status: 'Upload',
      });

      component.onClear();

      expect(component.filterForm.get('testId')?.value).toBeNull();
      expect(component.filterForm.get('absorbance')?.value).toBeNull();
      expect(component.filterForm.get('ratio')?.value).toBeNull();
      expect(component.filterForm.get('resultValue')?.value).toBeNull();
      expect(component.filterForm.get('status')?.value).toBeNull();
    });
  });
});
