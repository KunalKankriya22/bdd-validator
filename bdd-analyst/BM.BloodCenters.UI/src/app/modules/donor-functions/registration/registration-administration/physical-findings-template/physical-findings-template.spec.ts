import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';

import { PhysicalFindingsTemplateComponent } from './physical-findings-template';
import { PhysicalFindingsTemplateService } from './services/physical-findings-template.service';
import { HeaderService } from '@shared/services/header.service';
import { PhysicalFindingsTemplateResponse, PhysicalFindingsTemplateFilterValue } from './models/physical-findings-template.model';
import { provideRouter } from '@angular/router';
import { createMockHeaderService } from '@shared/testing/common-mocks';

// Mock TranslateLoader
class MockTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({});
  }
}

describe('PhysicalFindingsTemplateComponent', () => {
  let component: PhysicalFindingsTemplateComponent;
  let fixture: ComponentFixture<PhysicalFindingsTemplateComponent>;
  let templateServiceSpy: jasmine.SpyObj<PhysicalFindingsTemplateService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockResponse: PhysicalFindingsTemplateResponse = {
    success: true,
    data: [],
    total: 0,
    statusCode: 200
  };

  beforeEach(() => {

    templateServiceSpy = jasmine.createSpyObj('PhysicalFindingsTemplateService', [
      'getTemplates',
      'getFilterDropdowns',
      'updateTerminationDate',
      'batchUpdateTerminationDate'
    ]);
    templateServiceSpy.getTemplates.and.returnValue(of(mockResponse));

    headerServiceSpy = createMockHeaderService();



      TestBed.configureTestingModule({
      imports: [PhysicalFindingsTemplateComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatSnackBarModule,
        MatDialogModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: MockTranslateLoader }
        })],
      providers: [
        provideRouter([]),
        { provide: PhysicalFindingsTemplateService, useValue: templateServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });


    


      templateServiceSpy.getTemplates.calls.reset();


      templateServiceSpy.getFilterDropdowns.calls.reset();


      templateServiceSpy.updateTerminationDate.calls.reset();


      templateServiceSpy.batchUpdateTerminationDate.calls.reset();


      templateServiceSpy.getTemplates.and.returnValue(of(mockResponse));


    fixture = TestBed.createComponent(PhysicalFindingsTemplateComponent);
    component = fixture.componentInstance;


    });




  it('should have correct search placeholder', () => {
    expect(component.searchConfig.placeholder).toBe('Search by Template ID');
  });



  it('should toggle bulk update section', () => {
    expect(component.showBulkUpdateSection).toBeFalse();
    component.toggleBulkUpdateSection();
    expect(component.showBulkUpdateSection).toBeTrue();
    component.toggleBulkUpdateSection();
    expect(component.showBulkUpdateSection).toBeFalse();
  });

  it('should update request state on search', () => {
    component.onSearch('TMPL001');
    expect(component.requestState.searchKeyword).toBe('TMPL001');
  });





  it('should handle hasActiveFilters correctly', () => {
    expect(component.hasActiveFilters()).toBeFalse();

    const filters: PhysicalFindingsTemplateFilterValue = {
      donationType: 'DI',
      procedureCode: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    };
    component.appliedFilters = filters;

    expect(component.hasActiveFilters()).toBeTrue();
  });



  it('should get correct status class for active template', () => {
    expect(component.getStatusClass('ACTIVE')).toBe('active');
  });

  it('should get correct status class for inactive template', () => {
    expect(component.getStatusClass('INACTIVE')).toBe('inactive');
  });

  it('should get correct status class for future template', () => {
    expect(component.getStatusClass('FUTURE')).toBe('future');
  });







  it('should handle selection change', () => {
    const mockTemplates = [
      { templateId: 'T1', donationType: 'DI', procedureCode: 'WB' }
    ] as any[];
    component.onSelectionChange(mockTemplates);
    expect(component.selectedTemplates).toEqual(mockTemplates);
  });
});
