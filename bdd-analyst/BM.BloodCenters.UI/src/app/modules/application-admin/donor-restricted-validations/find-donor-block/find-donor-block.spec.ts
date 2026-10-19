import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, Observable, EMPTY } from 'rxjs';
import { signal } from '@angular/core';

import { FindDonorBlockComponent } from './find-donor-block';
import { FindDonorBlockService } from './services/find-donor-block.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { FindDonorBlockModel } from './models/find-donor-block.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('FindDonorBlockComponent', () => {
  let routerSpy: any;
  let serviceSpy: any;
  let component: FindDonorBlockComponent;
  let fixture: ComponentFixture<FindDonorBlockComponent>;
  let findDonorBlockService: jasmine.SpyObj<FindDonorBlockService>;
  let router: jasmine.SpyObj<Router>;

  const mockProgramData: FindDonorBlockModel[] = [
    {
      programName: 'PROGRAM_A',
      createNewDonor: true,
      gradeLevel: '2',
      newAllowed: true,
      newAllowedGrade: '1',
      selectAllowed: 'Optional',
      selectAllowedGrade: '2',
      selectMultipleGrade: '3',
      holdAllowed: false,
      flag1: true,
      flag2: false,
      flag3: false,
      flag4: false
    },
    {
      programName: 'PROGRAM_B',
      createNewDonor: false,
      gradeLevel: '1',
      newAllowed: false,
      newAllowedGrade: '',
      selectAllowed: true,
      selectAllowedGrade: '1',
      selectMultipleGrade: '2',
      holdAllowed: true,
      flag1: false,
      flag2: true,
      flag3: false,
      flag4: false
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('FindDonorBlockService', ['getProgramRules']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: EMPTY
    });
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('/mock-url');
    const headerServiceSpy = createMockHeaderService();
    const pageHeaderServiceSpy = {
      pageHeaderData: signal({ title: 'Find Donor Configuration', subtitle: 'Configure how donor searches work.' }),
      getCurrentMenuItem: jasmine.createSpy('getCurrentMenuItem').and.returnValue({ remarks: 'Configure how donor searches work.' })
    };
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { params: {} }
    });



      TestBed.configureTestingModule({
      imports: [FindDonorBlockComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: FindDonorBlockService, useValue: serviceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy }
      ]
    });


    


      serviceSpy.getProgramRules.calls.reset();


      routerSpy.navigate.calls.reset();


      routerSpy.createUrlTree.calls.reset();


      routerSpy.serializeUrl.calls.reset();


      routerSpy.createUrlTree.and.returnValue({} as any);


      routerSpy.serializeUrl.and.returnValue('/mock-url');


    findDonorBlockService = TestBed.inject(FindDonorBlockService) as jasmine.SpyObj<FindDonorBlockService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;


    
    fixture = TestBed.createComponent(FindDonorBlockComponent);
    component = fixture.componentInstance;
  });


  describe('Data Loading', () => {
    it('should load program rules on init', () => {
      findDonorBlockService.getProgramRules.and.returnValue(of(mockProgramData));

      fixture.detectChanges();

      expect(findDonorBlockService.getProgramRules).toHaveBeenCalled();
      expect(component.dataSource).toEqual(mockProgramData);
      expect(component.isLoading).toBe(false);
    });



    it('should set loading state correctly', (done) => {
      let resolveData: any;
      const delayedObservable = new Observable<FindDonorBlockModel[]>((observer) => {
        setTimeout(() => {
          observer.next(mockProgramData);
          observer.complete();
        }, 10);
      });

      findDonorBlockService.getProgramRules.and.returnValue(delayedObservable);

      expect(component.isLoading).toBe(false);

      component.loadData();

      // Should be loading immediately after calling loadData
      expect(component.isLoading).toBe(true);

      setTimeout(() => {
        expect(component.isLoading).toBe(false);
        done();
      }, 50);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      findDonorBlockService.getProgramRules.and.returnValue(of(mockProgramData));
      fixture.detectChanges();
    });

    it('should filter rules based on search keyword', () => {
      component.onSearch('PROGRAM_A');

      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].programName).toBe('PROGRAM_A');
    });

    it('should show all rules when search keyword is empty', () => {
      component.onSearch('');

      expect(component.dataSource.length).toBe(mockProgramData.length);
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      findDonorBlockService.getProgramRules.and.returnValue(of(mockProgramData));
      fixture.detectChanges();
    });

    it('should cycle through sort states', () => {
      expect(component.sortDirection).toBe('');

      component.onSort();
      expect(component.sortDirection).toBe('asc');

      component.onSort();
      expect(component.sortDirection).toBe('desc');

      component.onSort();
      expect(component.sortDirection).toBe('');
    });
  });

  describe('Side Panel', () => {


    it('should open side panel in edit mode with selected program', () => {
      findDonorBlockService.getProgramRules.and.returnValue(of(mockProgramData));
      fixture.detectChanges();

      const program = mockProgramData[0];
      component.editRecord(program);

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(program);
    });



    it('should reload data after successful save', (done) => {
      findDonorBlockService.getProgramRules.and.returnValue(of(mockProgramData));

      component.onSaveSuccess();

      setTimeout(() => {
        expect(component.sidePanelOpen).toBe(false);
        expect(findDonorBlockService.getProgramRules).toHaveBeenCalled();
        done();
      }, 350);
    });
  });
});
