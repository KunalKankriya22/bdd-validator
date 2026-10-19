import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiTempDataQueryFilterPanel, ApiTempDataQueryFilterValue } from './api-temp-data-query-filter-panel';

describe('ApiTempDataQueryFilterPanel', () => {
  let component: ApiTempDataQueryFilterPanel;
  let fixture: ComponentFixture<ApiTempDataQueryFilterPanel>;

  const mockIdTypes = [
    { code: 'APITY1', description: 'Type 1' },
    { code: 'APITY2', description: 'Type 2' }
  ];

  const mockSourceIds = [
    { sourceId: 'LAP' },
    { sourceId: 'SFA' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ApiTempDataQueryFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(ApiTempDataQueryFilterPanel);
    component = fixture.componentInstance;
    component.idTypes = mockIdTypes;
    component.sourceIds = mockSourceIds;
    fixture.detectChanges();
  });


  it('should initialize form with current filters when provided', () => {
    const currentFilters: ApiTempDataQueryFilterValue = {
      idType: 'APITY1',
      sourceId: 'SFA',
      periodType: 'after',
      insertDate: new Date('2024-01-15')
    };

    component.currentFilters = currentFilters;
    component.ngOnInit();

    expect(component.filterForm.value).toEqual({
      idType: 'APITY1',
      sourceId: 'SFA',
      periodType: 'after',
      insertDate: new Date('2024-01-15')
    });
  });









  it('should have correct period type options', () => {
    expect(component.periodTypes).toEqual([
      { value: 'after', label: 'After' },
      { value: 'before', label: 'Before' }
    ]);
  });


  it('should accept sourceIds input', () => {
    component.sourceIds = mockSourceIds;
    expect(component.sourceIds.length).toBe(2);
    expect(component.sourceIds[0].sourceId).toBe('LAP');
  });
});
