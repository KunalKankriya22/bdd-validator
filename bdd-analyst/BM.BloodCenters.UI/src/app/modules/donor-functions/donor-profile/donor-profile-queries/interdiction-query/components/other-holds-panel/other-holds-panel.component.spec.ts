import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { OtherHoldsPanelComponent } from './other-holds-panel.component';
import { InterdictionQueryService } from '../../services/interdiction-query.service';
import { OtherHold } from '../../models/interdiction-query.model';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('OtherHoldsPanelComponent', () => {
  let component: OtherHoldsPanelComponent;
  let fixture: ComponentFixture<OtherHoldsPanelComponent>;
  let interdictionQueryServiceSpy: jasmine.SpyObj<InterdictionQueryService>;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;

  const mockOtherHolds: OtherHold[] = [
    {
      interCode: '10IB',
      interDesc: 'TB for Function 1.01',
      originatedFrom: 'DONOR',
      reasonCode: undefined,
      effDate: '2025-01-11',
      termDate: null
    },
    {
      interCode: 'HDT',
      interDesc: 'Health History Deferral - Temporary',
      originatedFrom: 'DONOR',
      reasonCode: 'CMV',
      effDate: '2025-01-11',
      termDate: '2025-06-11'
    }
  ];

  beforeEach(async () => {
    interdictionQueryServiceSpy = jasmine.createSpyObj('InterdictionQueryService', [
      'getOtherHolds'
    ]);
    interdictionQueryServiceSpy.getOtherHolds.and.returnValue(of(mockOtherHolds));

    translateServiceSpy = createMockTranslateService();
    await TestBed.configureTestingModule({
      imports: [
        OtherHoldsPanelComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: InterdictionQueryService, useValue: interdictionQueryServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OtherHoldsPanelComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {

    it('should load other holds on init', () => {
      component.data = { transactionId: 'TXN123', unitId: 'W12342402705-Q' };
      fixture.detectChanges();

      expect(interdictionQueryServiceSpy.getOtherHolds).toHaveBeenCalledWith('TXN123', false);
      expect(component.otherHolds()).toEqual(mockOtherHolds);
      expect(component.isLoading()).toBe(false);
      expect(component.hasError()).toBe(false);
    });


  });
  describe('Date Formatting', () => {
    it('should format valid dates correctly', () => {
      const formattedDate = component.formatDate('2025-01-11');
      expect(formattedDate).toBe('11-JAN-2025');
    });


  });

  describe('Display Value', () => {

    it('should return dash for empty or null values', () => {
      expect(component.displayValue(null)).toBe('-');
      expect(component.displayValue(undefined)).toBe('-');
      expect(component.displayValue('')).toBe('-');
      expect(component.displayValue('   ')).toBe('-');
    });
  });
});
