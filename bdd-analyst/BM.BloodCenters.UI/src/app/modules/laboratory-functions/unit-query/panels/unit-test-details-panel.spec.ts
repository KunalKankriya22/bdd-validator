import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { UnitTestDetailsPanelComponent } from './unit-test-details-panel';
import { UnitQueryService } from '../unit-query.service';
import { UnitQueryPanelRecord } from '../unit-query.model';

describe('UnitTestDetailsPanelComponent', () => {
  let component: UnitTestDetailsPanelComponent;
  let fixture: ComponentFixture<UnitTestDetailsPanelComponent>;
  let mockService: jasmine.SpyObj<UnitQueryService>;

  const mockRecord: UnitQueryPanelRecord = {
    unitId: 'U001', collDate: '2025-01-01', chapterId: 'CH1', unitSchemeType: null, noteId: null,
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('UnitQueryService', ['getUnitTestDetails']);
    mockService.getUnitTestDetails.and.returnValue(of({ scheduledTests: [], unscheduledTests: [] }));

    await TestBed.configureTestingModule({
      imports: [UnitTestDetailsPanelComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: UnitQueryService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnitTestDetailsPanelComponent);
    component = fixture.componentInstance;
    component.record = mockRecord;
  });

  it('should load test results on init', () => {
    mockService.getUnitTestDetails.and.returnValue(of({
      scheduledTests: [{ testId: 'T1', testSeqNo: 1 }],
      unscheduledTests: [{ testId: 'T2', testSeqNo: 1 }],
    } as any));
    fixture.detectChanges();
    expect(component.scheduledTests.length).toBe(1);
    expect(component.unscheduledTests.length).toBe(1);
    expect(component.loading).toBeFalse();
  });


});
