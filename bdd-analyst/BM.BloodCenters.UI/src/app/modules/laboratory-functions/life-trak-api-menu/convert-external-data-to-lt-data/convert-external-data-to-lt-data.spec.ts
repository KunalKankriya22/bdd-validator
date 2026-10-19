import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConvertExternalDataToLtData } from './convert-external-data-to-lt-data';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

describe('ConvertExternalDataToLtData', () => {
  let component: ConvertExternalDataToLtData;
  let fixture: ComponentFixture<ConvertExternalDataToLtData>;

  beforeEach(() => {



      TestBed.configureTestingModule({
      imports: [
        ConvertExternalDataToLtData,
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: PageHeaderService,
          useValue: {
            pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue(null),
            getTitle: jasmine.createSpy('getTitle').and.returnValue('Convert External Data to LT Data'),
          },
        },
        {
          provide: SnackbarService,
          useValue: {
            showSuccess: jasmine.createSpy('showSuccess'),
            showError: jasmine.createSpy('showError'),
          },
        },
      ],
    });


    



    fixture = TestBed.createComponent(ConvertExternalDataToLtData);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should initialize form with Source ID field', () => {
    expect(component.searchForm).toBeDefined();
    expect(component.searchForm.get('sourceApplId')).toBeDefined();
  });





  it('should clear form and data on CLEAR ALL', () => {
    component.searchForm.get('sourceApplId')?.setValue('DRM');
    component.dataSource = [
      {
        sourceApplId: 'DRM',
        sourceValue: 'TEST',
        targetApplId: 'BC',
        targetValue: 'TARGET',
        targetValueType: 'TYPE',
        effDate: '2025-01-01',
      },
    ];
    component.hasSearched = true;

    component.onClearAll();

    expect(component.searchForm.get('sourceApplId')?.value).toBeNull();
    expect(component.dataSource.length).toBe(0);
    expect(component.hasSearched).toBe(false);
  });





  it('should open side panel in add mode when Add New is clicked', () => {
    component.searchForm.get('sourceApplId')?.setValue('DRM');

    component.onAddNew();

    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
    expect(component.sidePanelSourceApplId).toBe('DRM');
  });

  it('should open side panel in edit mode when edit action is triggered', () => {
    const mockMapping = {
      sourceApplId: 'DRM',
      sourceValue: 'TEST',
      targetApplId: 'BC',
      targetValue: 'TARGET',
      targetValueType: 'TYPE',
      effDate: '2025-01-01',
    };

    component.onRowAction({ action: 'edit', row: mockMapping });

    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toEqual(mockMapping);
    expect(component.sidePanelSourceApplId).toBe('DRM');
  });







  it('should show all source applications when search is cleared', () => {
    component.sourceApplications.set([
      { code: 'DRM', codeDesc: 'Donor Record Manager' },
      { code: 'LIS', codeDesc: 'Laboratory Information System' },
    ]);
    component.sourceAppSearchControl.setValue('DRM');

    component.sourceAppSearchControl.setValue('');

    expect(component.filteredSourceApplications.length).toBe(2);
  });



  it('should format datetime correctly', () => {
    const dateString = '2025-03-15T10:30:00Z';
    const formatted = (component as any).formatDate(dateString);
    expect(formatted).toContain('15-MAR-2025');
  });





  it('should initialize with empty dataSource', () => {
    expect(component.dataSource.length).toBe(0);
  });
});
