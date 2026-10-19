import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { LicensedProductsComponent } from './licensed-products';
import { LicensedProductsService } from './services/licensed-products.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { LicensedProduct, Chapter, ValidProduct } from './models/licensed-products.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('LicensedProductsComponent', () => {
  let component: LicensedProductsComponent;
  let fixture: ComponentFixture<LicensedProductsComponent>;
  let serviceSpy: jasmine.SpyObj<LicensedProductsService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockProducts: LicensedProduct[] = [
    {
      productCode: 'RBC001',
      productDescription: 'Red Blood Cells',
      chapterId: 'DAL',
      osokFlag: 'Y',
      effDate: '2024-01-01',
      termDate: null,
      insertDate: '2024-01-01T10:00:00Z'
    },
    {
      productCode: 'PLT001',
      productDescription: 'Platelets',
      chapterId: 'DAL',
      osokFlag: 'N',
      effDate: '2024-02-01',
      termDate: '2025-12-31',
      insertDate: '2024-02-01T10:00:00Z'
    }
  ];

  const mockChapters: Chapter[] = [
    { chapterId: 'DAL', chapterName: 'Dallas Chapter' },
    { chapterId: 'NYC', chapterName: 'New York Chapter' },
    { chapterId: 'LAX', chapterName: 'Los Angeles Chapter' }
  ];

  const mockValidProducts: ValidProduct[] = [
    { productCode: 'RBC001', productDesc: 'Red Blood Cells' },
    { productCode: 'PLT001', productDesc: 'Platelets' },
    { productCode: 'PLM001', productDesc: 'Plasma' }
  ];

  const chapterChanged$ = new Subject<void>();

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('LicensedProductsService', [
      'getLicensedProducts',
      'getChapters',
      'getValidProducts',
      'getCachedValidProducts'
    ]);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({
        title: 'Licensed Products',
        subtitle: 'Manage licensed products'
      })
    });
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });

    serviceSpy.getLicensedProducts.and.returnValue(
      of({ data: mockProducts, total: 2 })
    );
    serviceSpy.getChapters.and.returnValue(of(mockChapters));
    serviceSpy.getValidProducts.and.returnValue(of(mockValidProducts));
    serviceSpy.getCachedValidProducts.and.returnValue(mockValidProducts);



      TestBed.configureTestingModule({
      imports: [
        LicensedProductsComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideNoopAnimations(),
        { provide: LicensedProductsService, useValue: serviceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    });

      serviceSpy.getChapters.and.returnValue(of(mockChapters));


      serviceSpy.getValidProducts.and.returnValue(of(mockValidProducts));


      serviceSpy.getCachedValidProducts.and.returnValue(mockValidProducts);


    fixture = TestBed.createComponent(LicensedProductsComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should load chapters on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getChapters).toHaveBeenCalled();
      expect(component.chapters.length).toBe(3);
      expect(component.filteredChapters.length).toBe(3);
    }));





    it('should not show ADD NEW PRODUCT action before data is loaded', () => {
      fixture.detectChanges();

      expect(component.headerConfig.actions?.length).toBe(0);
    });


  });

  describe('Filter Form', () => {
    it('should initialize filter form with empty values', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeTruthy();
      expect(component.filterForm.get('chapterId')?.value).toBe('');
    });

    it('should update selectedChapterId when form value changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ chapterId: 'DAL' });
      tick();

      expect(component.selectedChapterId).toBe('DAL');
    }));

    it('should return chapter name for selected chapter', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ chapterId: 'DAL' });

      expect(component.selectedChapterName).toBe('Dallas Chapter');
    }));


  });

  describe('Chapter Search Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter chapters by chapter ID', fakeAsync(() => {
      component.chapterSearchControl.setValue('dal');
      tick();

      expect(component.filteredChapters.length).toBeGreaterThan(0);
      expect(component.filteredChapters.some(c => c.chapterId.toLowerCase().includes('dal'))).toBe(true);
    }));

    it('should filter chapters by chapter name', fakeAsync(() => {
      component.chapterSearchControl.setValue('dallas');
      tick();

      expect(component.filteredChapters.length).toBeGreaterThan(0);
      expect(component.filteredChapters.some(c => c.chapterName?.toLowerCase().includes('dallas'))).toBe(true);
    }));

    it('should show all chapters when search is empty', fakeAsync(() => {
      component.chapterSearchControl.setValue('');
      tick();

      expect(component.filteredChapters.length).toBe(component.chapters.length);
    }));
  });

  describe('Data Loading', () => {
    beforeEach(() => {
      component.selectedChapterId = 'DAL';
    });

    it('should call getLicensedProducts service', fakeAsync(() => {
      serviceSpy.getLicensedProducts.and.returnValue(of({ data: [], total: 0 }));
      component.loadData();
      tick();

      expect(serviceSpy.getLicensedProducts).toHaveBeenCalledWith(
        'DAL',
        25,
        0,
        jasmine.any(Object)
      );
    }));








  });

  describe('Retrieve Functionality', () => {




    it('should set hasLoadedData to true', fakeAsync(() => {
      component.selectedChapterId = 'DAL';

      component.onRetrieve();
      tick();

      expect(component.hasLoadedData).toBe(true);
    }));

    it('should show ADD NEW PRODUCT button after retrieve', fakeAsync(() => {
      component.selectedChapterId = 'DAL';

      component.onRetrieve();
      tick();

      expect(component.headerConfig.actions?.length).toBe(1);
    }));
  });

  describe('Clear All Functionality', () => {


    it('should reset search and data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.searchText = 'test';
      component.dataSource = mockProducts;
      component.selectedChapterId = 'DAL';

      component.onClearAll();

      expect(component.searchText).toBe('');
      expect(component.dataSource.length).toBe(0);
      expect(component.selectedChapterId).toBeNull();
    }));




  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      component.selectedChapterId = 'DAL';
    });

    it('should load data with search keyword', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSearch('RBC');
      tick();

      expect(serviceSpy.getLicensedProducts).toHaveBeenCalledWith(
        'DAL',
        25,
        0,
        jasmine.objectContaining({ searchKeyword: 'RBC' })
      );
    }));




  });



  describe('Create Record', () => {
    beforeEach(() => {
      component.selectedChapterId = 'DAL';
    });



    it('should pass cached valid products to side panel', () => {
      component.createRecord();

      expect(serviceSpy.getCachedValidProducts).toHaveBeenCalled();
      expect(component.validProductsCache).toEqual(mockValidProducts);
    });

    it('should reload data after successful save', () => {
      fixture.detectChanges();
      const initialCalls = serviceSpy.getLicensedProducts.calls.count();

      component.onSaveSuccess();

      expect(serviceSpy.getLicensedProducts.calls.count()).toBe(initialCalls + 1);
    });

    it('should allow opening side panel even if already open (mode switch)', () => {
      component.sidePanelOpen = true;
      component.sidePanelMode = 'edit';

      component.createRecord();

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });


  });

  describe('Edit Record', () => {
    const mockProduct: LicensedProduct = mockProducts[0];

    beforeEach(() => {
      component.selectedChapterId = 'DAL';
    });

    it('should open side panel in edit mode', () => {
      component.editRecord(mockProduct);

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockProduct);
    });

    it('should allow switching from add to edit mode', () => {
      component.sidePanelOpen = true;
      component.sidePanelMode = 'add';

      component.editRecord(mockProduct);

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockProduct);
    });

    it('should handle mode change event', () => {
      component.sidePanelData = mockProduct;

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('Row Action', () => {
    it('should call editRecord when edit action is triggered', () => {
      spyOn(component, 'editRecord');

      component.onRowAction({ action: 'edit', row: mockProducts[0] });

      expect(component.editRecord).toHaveBeenCalledWith(mockProducts[0]);
    });
  });

  describe('Chapter Change Handling', () => {


    it('should reload chapters on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const initialCalls = serviceSpy.getChapters.calls.count();
      chapterChanged$.next();
      tick();

      expect(serviceSpy.getChapters.calls.count()).toBe(initialCalls + 1);
    }));
  });

  describe('Date Formatting', () => {
    it('should format date as DD-MON-YYYY', () => {
      const formatted = component['formatDate']('2024-01-15');
      expect(formatted).toBe('15-JAN-2024');
    });




  });
});
