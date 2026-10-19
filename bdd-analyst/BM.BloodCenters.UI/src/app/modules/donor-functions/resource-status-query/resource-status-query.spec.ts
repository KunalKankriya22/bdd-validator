import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ResourceStatusQuery } from './resource-status-query';
import { ResourceStatusQueryService } from './services/resource-status-query.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('ResourceStatusQuery', () => {
  let headerServiceSpy: any;
  let resourceServiceSpy: any;
  let component: ResourceStatusQuery;
  let fixture: ComponentFixture<ResourceStatusQuery>;
  let resourceStatusQueryService: jasmine.SpyObj<ResourceStatusQueryService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;

  const mockResourcesResponse = {
    data: [
      { resourceCode: 'RES01', resourceDesc: 'Resource 1', criticalInd: 'Y' },
      { resourceCode: 'RES02', resourceDesc: 'Resource 2', criticalInd: 'N' }
    ],
    success: true
  };

  const mockQueryResponse = {
    data: [
      {
        driveDate: '03-31-2026 TUE',
        resourceCode: 'RES01',
        resourceDesc: 'Resource 1',
        maximumRes: 10,
        exceptionRes: 8,
        bookedRes: 3,
        availRes: 5,
        criticalInd: 'Y'
      }
    ],
    total: 1,
    totalRecords: 1,
    success: true
  };

  beforeEach(() => {

    resourceServiceSpy = jasmine.createSpyObj('ResourceStatusQueryService', [
      'searchResourceStatus',
      'getResources'
    ]);
    headerServiceSpy = createMockHeaderService();
    const pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue({ title: 'Resource Status Query', subtitle: '' })
    });

    resourceServiceSpy.getResources.and.returnValue(of(mockResourcesResponse));
    resourceServiceSpy.searchResourceStatus.and.returnValue(of(mockQueryResponse));
      TestBed.configureTestingModule({
      imports: [ResourceStatusQuery, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: ResourceStatusQueryService, useValue: resourceServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    });


    


      resourceServiceSpy.searchResourceStatus.calls.reset();


      resourceServiceSpy.getResources.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      resourceServiceSpy.getResources.and.returnValue(of(mockResourcesResponse));


      resourceServiceSpy.searchResourceStatus.and.returnValue(of(mockQueryResponse));
    fixture = TestBed.createComponent(ResourceStatusQuery);
    component = fixture.componentInstance;
    resourceStatusQueryService = TestBed.inject(ResourceStatusQueryService) as jasmine.SpyObj<ResourceStatusQueryService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    pageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;


    });
  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be invalid when start date is missing', () => {
      component.filterForm.patchValue({
        fromDate: null,
        toDate: new Date()
      });
      expect(component.filterForm.invalid).toBeTrue();
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be invalid when end date is missing', () => {
      component.filterForm.patchValue({
        fromDate: new Date(),
        toDate: null
      });
      expect(component.filterForm.invalid).toBeTrue();
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be valid when both dates are provided', () => {
      component.filterForm.patchValue({
        fromDate: new Date('2026-03-01'),
        toDate: new Date('2026-03-31')
      });
      expect(component.filterForm.valid).toBeTrue();
      expect(component.isRetrieveDisabled).toBeFalse();
    });

    it('should mark all fields as touched when submitting invalid form', () => {
      component.onRetrieve();
      expect(component.filterForm.get('fromDate')?.touched).toBeTrue();
      expect(component.filterForm.get('toDate')?.touched).toBeTrue();
    });
  });

  describe('Resources Loading', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load resources when both dates are set', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: new Date('2026-03-01'),
        toDate: new Date('2026-03-31')
      });
      tick(500);

      expect(resourceStatusQueryService.getResources).toHaveBeenCalled();
      expect(component.resourceOptions).toEqual(mockResourcesResponse.data);
    }));



    it('should clear resources on error', fakeAsync(() => {
      resourceStatusQueryService.getResources.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.filterForm.patchValue({
        fromDate: new Date('2026-03-01'),
        toDate: new Date('2026-03-31')
      });
      tick(500);

      expect(component.resourceOptions).toEqual([]);
    }));
  });

  describe('Data Retrieval', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: new Date('2026-03-01'),
        toDate: new Date('2026-03-31')
      });
    });

    it('should retrieve data when form is valid', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect(resourceStatusQueryService.searchResourceStatus).toHaveBeenCalled();
      expect(component.dataSource).toEqual(mockQueryResponse.data);
      expect(component.hasRetrievedData).toBeTrue();
      expect(component.showEmptyState).toBeFalse();
    }));





    it('should reset pagination to first page on retrieve', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.onRetrieve();
      tick();

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    }));
  });



  describe('Filter Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should apply filters', fakeAsync(() => {
      const filters = {
        criticalInd: 'Y'
      };
      component.hasRetrievedData = true;
      component.filterForm.patchValue({
        fromDate: new Date('2026-03-01'),
        toDate: new Date('2026-03-31')
      });

      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters).toEqual(filters);
    }));

    it('should remove filter chip', fakeAsync(() => {
      component.appliedFilters = {
        criticalInd: 'Y'
      };
      component.filterChips = [{ key: 'criticalInd', label: 'Critical', value: 'Y', removable: true }];
      component.hasRetrievedData = true;
      component.filterForm.patchValue({
        fromDate: new Date('2026-03-01'),
        toDate: new Date('2026-03-31')
      });

      component.removeFilterChip('criticalInd');
      tick();
    }));


  });






});
