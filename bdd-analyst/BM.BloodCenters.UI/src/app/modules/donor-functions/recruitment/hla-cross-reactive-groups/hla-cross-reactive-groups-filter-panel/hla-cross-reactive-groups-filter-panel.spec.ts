import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import moment from 'moment';

import { HlaCrossReactiveGroupsFilterPanel } from './hla-cross-reactive-groups-filter-panel';
import { HlaCrossReactiveGroupFilterValue } from '../models/hla-cross-reactive-groups.model';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('HlaCrossReactiveGroupsFilterPanel', () => {
  let component: HlaCrossReactiveGroupsFilterPanel;
  let fixture: ComponentFixture<HlaCrossReactiveGroupsFilterPanel>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const chapterChanged$ = new Subject<void>();

  beforeAll(async () => {

    headerServiceSpy = createMockHeaderService();
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [], {
      chapterTimeZone: signal('-05:00')
    });



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        HlaCrossReactiveGroupsFilterPanel,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatMomentDateModule
      ],
      providers: [
        provideNoopAnimations(),
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy }
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(HlaCrossReactiveGroupsFilterPanel);
    component = fixture.componentInstance;
    component.hlaStandardOptions = [
      { code: 'AABB', description: 'AABB - Standard' },
      { code: 'CREG', description: 'CREG - Standard' }
    ];
    fixture.detectChanges();


    });

  describe('Form Initialization', () => {

    it('should initialize form with provided current filters', () => {
      const currentFilters: HlaCrossReactiveGroupFilterValue = {
        hlaStandard: 'AABB',
        effectivePeriod: 'AFTER',
        effectiveDate: '2025-01-01',
        terminationPeriod: 'BEFORE',
        terminationDate: '2025-12-31'
      };

      component.currentFilters = currentFilters;
      component.ngOnInit();

      expect(component.filterForm.get('hlaStandard')?.value).toBe('AABB');
      expect(component.filterForm.get('effectivePeriod')?.value).toBe('AFTER');
      expect(component.filterForm.get('terminationPeriod')?.value).toBe('BEFORE');
    });
  });

  describe('Apply Filters', () => {


    it('should have validation for period and date combinations', () => {
      component.filterForm.patchValue({
        effectivePeriod: '',
        effectiveDate: moment('2025-01-01')
      });

      expect(component.filterForm.get('effectiveDate')?.value).toBeTruthy();
    });

    it('should validate date field when period is selected', () => {
      component.filterForm.patchValue({
        effectivePeriod: 'AFTER',
        effectiveDate: null
      });

      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });
  });
  describe('Period and Date Interaction', () => {
    it('should allow setting effective date when period is set', () => {
      component.filterForm.patchValue({
        effectivePeriod: 'AFTER',
        effectiveDate: moment('2025-01-01')
      });

      expect(component.filterForm.get('effectivePeriod')?.value).toBe('AFTER');
      expect(component.filterForm.get('effectiveDate')?.value).toBeTruthy();
    });

    it('should allow setting termination date when period is set', () => {
      component.filterForm.patchValue({
        terminationPeriod: 'BEFORE',
        terminationDate: moment('2025-12-31')
      });

      expect(component.filterForm.get('terminationPeriod')?.value).toBe('BEFORE');
      expect(component.filterForm.get('terminationDate')?.value).toBeTruthy();
    });
  });
});
