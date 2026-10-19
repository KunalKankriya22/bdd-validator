import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { of, throwError } from 'rxjs';
import { DefineDriveCategoryRulesComponent } from './define-drive-category-rules';
import { DriveCategoryRulesService } from './services/drive-category-rules.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('DefineDriveCategoryRulesComponent', () => {
  let component: DefineDriveCategoryRulesComponent;
  let fixture: ComponentFixture<DefineDriveCategoryRulesComponent>;
  let mockService: jasmine.SpyObj<DriveCategoryRulesService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockRules = [
    {
      ruleId: 'RULE001',
      driveCategory: 'MOBILE',
      description: 'Mobile Blood Drive',
      numberAllowed: 5,
      maxSize: 100,
      effDate: '2025-01-01',
      termDate: '2025-12-31',
      modificationDate: '2025-03-01'
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DriveCategoryRulesService', [
      'getDriveCategoryRules',
      'getNextRuleId',
      'getCategories'
    ]);
    mockService.getDriveCategoryRules.and.returnValue(of({ data: mockRules, totalRecords: 1 }));

    mockSnackBar = createMockMatSnackBar();



      TestBed.configureTestingModule({
      imports: [DefineDriveCategoryRulesComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMomentDateAdapter(),
        { provide: DriveCategoryRulesService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        provideRouter([]),
        Overlay
      ]
    });


    


      mockService.getDriveCategoryRules.calls.reset();


      mockService.getNextRuleId.calls.reset();


      mockService.getCategories.calls.reset();


      mockService.getDriveCategoryRules.and.returnValue(of({ data: mockRules, totalRecords: 1 }));


    fixture = TestBed.createComponent(DefineDriveCategoryRulesComponent);
    component = fixture.componentInstance;


    });






  it('should open side panel for add', () => {
    component.createRecord();

    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
  });

  it('should open side panel for edit', () => {
    const rule = mockRules[0];
    component.editRecord(rule);

    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toEqual(rule);
  });









  it('should apply filters', () => {
    const filters = {
      showTerminated: true,
      effectiveDatePeriod: 'After',
      effectiveDateValue: '2025-01-01',
      terminationDatePeriod: null,
      terminationDateValue: null
    };

    component.applyFilters(filters);

    expect(component.appliedFilters).toEqual(filters);
    expect(component.requestState.showTerminated).toBe(true);
  });




});
