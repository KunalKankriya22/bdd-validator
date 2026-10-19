import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BarCodeFilterPanel } from './bar-code-filter-panel';
import { HeaderService } from '@shared/services/header.service';
import { BarCodeFilterValue } from '../models/bar-code.model';
import { LabelingFilterDataService } from '../../services/labeling-filter-data.service';

describe('BarCodeFilterPanel', () => {
  let component: BarCodeFilterPanel;
  let fixture: ComponentFixture<BarCodeFilterPanel>;
  let filterDataService: LabelingFilterDataService;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        BarCodeFilterPanel,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatInputModule,
        MatNativeDateModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HeaderService, useValue: { chapterId: () => 'TEST', chapterTimeZone: () => 'America/Chicago' } },
        LabelingFilterDataService
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(BarCodeFilterPanel);
    component = fixture.componentInstance;
    filterDataService = TestBed.inject(LabelingFilterDataService);


    });
  describe('onApply', () => {

    it('should emit filters with result code', () => {
      filterDataService.setData('bar-code', []);
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        testId: null,
        resultCode: 'N',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ resultCode: 'N' })
      );
    });

    it('should emit filters with effective date and period', () => {
      filterDataService.setData('bar-code', []);
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        testId: null,
        resultCode: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDatePeriod).toBe('after');
      expect(emittedValue.effectiveDate).toBeDefined();
    });
  });
  describe('Options', () => {
    it('should have result code options', () => {
      filterDataService.setData('bar-code', []);
      fixture.detectChanges();

      expect(component.resultCodeOptions).toEqual([
        { value: 'N', display: 'Negative' },
        { value: 'P', display: 'Positive' }
      ]);
    });

  });
});