import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { FreezeDetailsPanelComponent } from './freeze-details-panel';
import { UnitQueryService } from '../unit-query.service';
import { ComponentNotesPanelRecord } from './component-notes-panel';

describe('FreezeDetailsPanelComponent', () => {
  let component: FreezeDetailsPanelComponent;
  let fixture: ComponentFixture<FreezeDetailsPanelComponent>;
  let mockService: jasmine.SpyObj<UnitQueryService>;

  const mockRecord: ComponentNotesPanelRecord = {
    unitId: 'U001', collDate: '2025-01-01', chapterId: 'CH1', productCode: 'RBC',
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('UnitQueryService', ['getFreezeDetails']);
    mockService.getFreezeDetails.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [FreezeDetailsPanelComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: UnitQueryService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FreezeDetailsPanelComponent);
    component = fixture.componentInstance;
    component.record = mockRecord;
  });

  it('should load freeze records on init', () => {
    mockService.getFreezeDetails.and.returnValue(of([
      { productCode: 'RBC', parmCode: 'FRZ', processDats: '2025-01-01T10:30:00', insertUser: 'admin' },
    ]));
    fixture.detectChanges();
    expect(component.freezeRecords.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should show error if no productCode', () => {
    component.record = { ...mockRecord, productCode: null };
    fixture.detectChanges();
    expect(component.error).toBe('No component selected.');
    expect(component.loading).toBeFalse();
  });


});
