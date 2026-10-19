import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { PathogenReductionPanelComponent } from './pathogen-reduction-panel';
import { UnitQueryService } from '../unit-query.service';
import { ComponentNotesPanelRecord } from './component-notes-panel';

describe('PathogenReductionPanelComponent', () => {
  let component: PathogenReductionPanelComponent;
  let fixture: ComponentFixture<PathogenReductionPanelComponent>;
  let mockService: jasmine.SpyObj<UnitQueryService>;

  const mockRecord: ComponentNotesPanelRecord = {
    unitId: 'U001', collDate: '2025-01-01', chapterId: 'CH1', productCode: 'E3102V00',
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('UnitQueryService', ['getPathogenReduction']);
    mockService.getPathogenReduction.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PathogenReductionPanelComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: UnitQueryService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PathogenReductionPanelComponent);
    component = fixture.componentInstance;
    component.record = mockRecord;
  });

  it('should load pathogen reduction details on init', () => {
    mockService.getPathogenReduction.and.returnValue(of([{ initialProdCode: 'P1' }]));
    fixture.detectChanges();
    expect(component.details.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should show error if no productCode', () => {
    component.record = { ...mockRecord, productCode: null };
    fixture.detectChanges();
    expect(component.error).toBe('No component selected.');
    expect(component.loading).toBeFalse();
  });


});
