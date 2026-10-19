import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, NEVER } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { ActivatedRoute, Router } from '@angular/router';

import { PrdtyatComponent } from './prdtyat.component';
import { PrdtyatService } from './services/prdtyat.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ProductTypeAttribute } from './models/product-type-attribute.model';
import { createMockRouter, createMockActivatedRoute } from '@shared/testing/page-header-service.mock';
import { createMockTranslateService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('PrdtyatComponent', () => {
  let pageHeaderServiceSpy: any;
  let prdtyatServiceSpy: any;
  let component: PrdtyatComponent;
  let fixture: ComponentFixture<PrdtyatComponent>;
  let prdtyatService: jasmine.SpyObj<PrdtyatService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let headerService: jasmine.SpyObj<HeaderService>;

  const mockData: ProductTypeAttribute[] = [
    {
      anticoagulantCode: '5',
      volume: 450,
      productType: 'APLS',
      attributeGroup: 'V0001035',
      attributeGroupDesc: 'Blood Core',
      attributeCode: 'V0001035',
      attributeCodeDesc: 'CPD/XX/<=18C',
      productClass: 'C0008',
      modifierCode: 'M0000',
      effDate: '2012-10-07',
      termDate: null
    }
  ];

  beforeEach(() => {

    prdtyatServiceSpy = jasmine.createSpyObj('PrdtyatService', [
      'getProductTypeAttributes'
    ]);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], {
      pageHeaderData: jasmine.createSpy().and.returnValue({})
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('');
    pageHeaderServiceSpy.getSubtitle.and.returnValue('');
    pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);
    const headerServiceSpy = createMockHeaderService();
    const translateServiceSpy = createMockTranslateService();



      TestBed.configureTestingModule({
      imports: [PrdtyatComponent, NoopAnimationsModule],
      providers: [
        { provide: PrdtyatService, useValue: prdtyatServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: Router, useValue: createMockRouter() },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() }
      ]
    });


    


      prdtyatServiceSpy.getProductTypeAttributes.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getSubtitle.calls.reset();


      pageHeaderServiceSpy.getCurrentMenuItem.calls.reset();


      pageHeaderServiceSpy.getTitle.and.returnValue('');


      pageHeaderServiceSpy.getSubtitle.and.returnValue('');


      pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);


    prdtyatService = TestBed.inject(PrdtyatService) as jasmine.SpyObj<PrdtyatService>;
    pageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;

    prdtyatService.getProductTypeAttributes.and.returnValue(
      of({ data: mockData, total: 1 })
    );

    fixture = TestBed.createComponent(PrdtyatComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should set dataSource from API response', () => {
      fixture.detectChanges();
      expect(component.dataSource).toEqual(mockData);
    });


  });
  describe('Search Functionality', () => {
    it('should update requestState when searching', () => {
      fixture.detectChanges();
      component.onSearch('APLS');
      expect(component.requestState.searchKeyword).toBe('APLS');
    });




  });
  describe('Row Actions', () => {
    it('should open edit panel when edit action is triggered', () => {
      fixture.detectChanges();
      component.onRowAction({ action: 'edit', row: mockData[0] });
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockData[0]);
    });
  });

  describe('Side Panel', () => {
    it('should open add panel when createRecord is called', () => {
      component.createRecord();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should close panel when closeSidePanel is called', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });


  });

  describe('Filters', () => {
    it('should update filterChips when filters are applied', () => {
      const filters = {
        anticoagulantCode: '5',
        productType: 'APLS'
      };
      component.applyFilters(filters);
      expect(component.filterChips.length).toBeGreaterThan(0);
    });





    it('should return true for hasActiveFilters when filters exist', () => {
      component.appliedFilters = { anticoagulantCode: '5' };
      expect(component.hasActiveFilters()).toBeTrue();
    });


  });
});
