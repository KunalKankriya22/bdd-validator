import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { ModifyCheckInBatchDetailsComponent } from './modify-check-in-batch-details';
import { ModifyCheckInBatchApiService } from './services/modify-check-in-batch-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockTranslateService, createMockPageHeaderService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ModifyCheckInBatchDetailsComponent', () => {
  let component: ModifyCheckInBatchDetailsComponent;
  let fixture: ComponentFixture<ModifyCheckInBatchDetailsComponent>;
  let mockApiService: jasmine.SpyObj<ModifyCheckInBatchApiService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {

    mockApiService = jasmine.createSpyObj('ModifyCheckInBatchApiService', [
      'getCheckInBatches',
      'getDropdownOptions',
      'updateCheckInBatch',
      'getBatchComments',
      'createBatchComment',
      'updateBatchComment',
      'deleteBatchComment',
    ]);
    mockHeaderService = createMockHeaderService();
    mockPageHeaderService = createMockPageHeaderService();
    mockTranslateService = createMockTranslateService();

    mockApiService.getCheckInBatches.and.returnValue(
      of({ items: [], totalRecords: 0 })
    );
    mockApiService.getDropdownOptions.and.returnValue(
      of({ productTypes: [], checkInUsers: [] })
    );
    mockPageHeaderService.getCurrentMenuItem.and.returnValue(undefined);
    mockPageHeaderService.getTitle.and.returnValue('');
    mockPageHeaderService.getSubtitle.and.returnValue('');



      TestBed.configureTestingModule({
      imports: [ModifyCheckInBatchDetailsComponent, NoopAnimationsModule],
      providers: [
        { provide: ModifyCheckInBatchApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: TranslateService, useValue: mockTranslateService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        },
      ],
    });


    


      mockApiService.getCheckInBatches.calls.reset();


      mockApiService.getDropdownOptions.calls.reset();


      mockApiService.updateCheckInBatch.calls.reset();


      mockApiService.getBatchComments.calls.reset();


      mockApiService.createBatchComment.calls.reset();


      mockApiService.updateBatchComment.calls.reset();


      mockApiService.deleteBatchComment.calls.reset();


      mockPageHeaderService.getCurrentMenuItem.and.returnValue(undefined);


      mockPageHeaderService.getTitle.and.returnValue('');


      mockPageHeaderService.getSubtitle.and.returnValue('');



    
    // Create fresh component instance before each test to avoid test pollution
    fixture = TestBed.createComponent(ModifyCheckInBatchDetailsComponent);
    component = fixture.componentInstance;
  });


  // NOTE: API calls are commented out in ngOnInit (using mock data temporarily)
  // Uncomment this test when API integration is complete
  // it('should load dropdown options and data on init', () => {
  //   // Arrange - Verify methods not called yet
  //   expect(mockApiService.getDropdownOptions).not.toHaveBeenCalled();
  //   expect(mockApiService.getCheckInBatches).not.toHaveBeenCalled();

  //   // Act - Trigger ngOnInit
  //   fixture.detectChanges();

  //   // Assert - Both methods should be called
  //   expect(mockApiService.getDropdownOptions).toHaveBeenCalled();
  //   expect(mockApiService.getCheckInBatches).toHaveBeenCalled();
  // });



  it('should search when search keyword is entered', () => {
    // Arrange
    const searchKeyword = '111619';
    spyOn(component, 'loadData');

    // Act
    component.onSearch(searchKeyword);

    // Assert
    expect(component.searchKeyword).toBe(searchKeyword);
    expect(component.loadData).toHaveBeenCalled();
  });












});
