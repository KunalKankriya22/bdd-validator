import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { of, throwError, Subject } from 'rxjs';

import { ConfigurationFormComponent } from './configuration-form.component';
import { SterileDockingLovService } from '../services/sterile-docking-lov.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DockingType } from '../models/sterile-docking-definition.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ConfigurationFormComponent', () => {
  let chapterTimezoneServiceSpy: any;
  let headerServiceSpy: any;
  let lovServiceSpy: any;
  let component: ConfigurationFormComponent;
  let fixture: ComponentFixture<ConfigurationFormComponent>;
  let lovService: jasmine.SpyObj<SterileDockingLovService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockDockingTypes = [
    { code: DockingType.BA, description: 'Bag to Bag' },
    { code: DockingType.FI, description: 'Filter' },
    { code: DockingType.SE, description: 'Segment' },
    { code: DockingType.FB, description: 'Filter to Bag' },
    { code: DockingType.NE, description: 'Needle' },
    { code: DockingType.BF, description: 'Bag to Filter' }
  ];

  const mockMachineCodes = [
    { code: '01', description: 'Machine 1' },
    { code: '02', description: 'Machine 2' }
  ];

  const mockWaferLots = [
    { code: 'WL001', description: 'Wafer Lot 1' },
    { code: 'WL002', description: 'Wafer Lot 2' }
  ];

  const mockCatalogNumbers = [
    { code: 'CAT001', description: 'Catalog 1' }
  ];

  const mockBagLots = [
    { code: 'BL001', description: 'Bag Lot 1' }
  ];

  const mockAttributeCodes = [
    { code: '+03', description: 'Attribute +03' }
  ];

  const mockFilterTypes = [
    { code: 'FT001', description: 'Filter Type 1' },
    { code: 'FT002', description: 'Filter Type 2' }
  ];

  const mockFilterLots = [
    { code: 'FL001', description: 'Filter Lot 1' }
  ];

  beforeEach(() => {

    lovServiceSpy = jasmine.createSpyObj('SterileDockingLovService', [
      'getDockingTypes',
      'getMachineCodes',
      'getWaferLots',
      'getCatalogNumbers',
      'getBagLots',
      'getAttributeCodes',
      'getFilterTypes',
      'getFilterLots',
      'getFilteredDropdowns',
      'parseCatalogBarcode'
    ]);

    headerServiceSpy = createMockHeaderService();
    const snackbarServiceSpy = createMockSnackbarService();

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['fetchChapterTimezone', 'getChapterLocalDate']);



      TestBed.configureTestingModule({
      imports: [
        ConfigurationFormComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        NgxMatSelectSearchModule],
      providers: [
        { provide: SterileDockingLovService, useValue: lovServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy }
      ]
    });

      headerServiceSpy.getCurrentChapterId.calls.reset();
      headerServiceSpy.getCurrentChapterTimezone.calls.reset();
    lovService = TestBed.inject(SterileDockingLovService) as jasmine.SpyObj<SterileDockingLovService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    // Setup default spy returns
    lovService.getDockingTypes.and.returnValue(of(mockDockingTypes));
    lovService.getMachineCodes.and.returnValue(of(mockMachineCodes));
    lovService.getWaferLots.and.returnValue(of(mockWaferLots));
    lovService.getCatalogNumbers.and.returnValue(of(mockCatalogNumbers));
    lovService.getBagLots.and.returnValue(of(mockBagLots));
    lovService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
    lovService.getFilterTypes.and.returnValue(of([]));
    lovService.getFilterLots.and.returnValue(of([]));
    lovService.getFilteredDropdowns.and.returnValue(of({ catalogNumbers: mockCatalogNumbers, bagLots: mockBagLots }));

    fixture = TestBed.createComponent(ConfigurationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {


    it('should mark required fields with validators', () => {
      const requiredFields = [
        'dockingType',
        'machineCode',
        'waferLotNumber',
        'numberOfUnits',
        'bagCatalogNumber',
        'bagLotNumber',
        'numberOfComponents'
      ];

      requiredFields.forEach(field => {
        const control = component.form.get(field);
        control?.setValue('');
        expect(control?.hasError('required')).toBe(true);
      });
    });



    it('should load all LOVs on init', () => {
      expect(lovService.getDockingTypes).toHaveBeenCalled();
      expect(lovService.getMachineCodes).toHaveBeenCalled();
      expect(lovService.getWaferLots).toHaveBeenCalled();
      expect(lovService.getCatalogNumbers).toHaveBeenCalled();
      expect(lovService.getBagLots).toHaveBeenCalled();
      expect(lovService.getAttributeCodes).toHaveBeenCalled();
    });

    it('should load filter types and filter lots on init', () => {
      expect(lovService.getFilterTypes).toHaveBeenCalled();
      expect(lovService.getFilterLots).toHaveBeenCalled();
    });

    it('should populate dockingTypes array from service', () => {
      expect(component.dockingTypes).toEqual(mockDockingTypes);
      expect(component.filteredDockingTypes).toEqual(mockDockingTypes);
    });

    it('should populate machineCodes array from service', () => {
      expect(component.machineCodes).toEqual(mockMachineCodes);
      expect(component.filteredMachines).toEqual(mockMachineCodes);
    });

    it('should populate waferLots array from service', () => {
      expect(component.waferLots).toEqual(mockWaferLots);
      expect(component.filteredWafers).toEqual(mockWaferLots);
    });

    it('should populate catalogNumbers array from service', () => {
      expect(component.catalogNumbers).toEqual(mockCatalogNumbers);
      expect(component.filteredCatalogs).toEqual(mockCatalogNumbers);
    });

    it('should populate bagLots array from service', () => {
      expect(component.bagLots).toEqual(mockBagLots);
      expect(component.filteredBagLots).toEqual(mockBagLots);
    });

    it('should populate attributeCodes array from service', () => {
      expect(component.attributeCodes).toEqual(mockAttributeCodes);
      expect(component.filteredAttributes).toEqual(mockAttributeCodes);
    });

    it('should have description field disabled', () => {
      expect(component.form.get('description')?.disabled).toBe(true);
    });

    it('should have attributeDescription field disabled', () => {
      expect(component.form.get('attributeDescription')?.disabled).toBe(true);
    });

    it('should patch initial data when provided', () => {
      // Tear down and rebuild with initialData
      const newFixture = TestBed.createComponent(ConfigurationFormComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.initialData = {
        dockingType: DockingType.BA,
        machineCode: '01',
        waferLotNumber: 'WL001',
        numberOfUnits: 5,
        bagCatalogNumber: 'CAT001',
        bagLotNumber: 'BL001',
        numberOfComponents: 3,
        attributeCode: '+03'
      };
      newFixture.detectChanges();

      expect(newComponent.form.get('dockingType')?.value).toBe(DockingType.BA);
      expect(newComponent.form.get('machineCode')?.value).toBe('01');
      expect(newComponent.form.get('waferLotNumber')?.value).toBe('WL001');
      expect(newComponent.form.get('numberOfUnits')?.value).toBe(5);
    });

    it('should not patch form when initialData is null', () => {
      const newFixture = TestBed.createComponent(ConfigurationFormComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.initialData = null;
      newFixture.detectChanges();

      expect(newComponent.form.get('dockingType')?.value).toBe('');
    });
  });

  describe('Conditional Filter Fields', () => {
    it('should show filter fields when docking type is FI', () => {
      component.form.patchValue({ dockingType: DockingType.FI });
      component.onDockingTypeChange(DockingType.FI);
      fixture.detectChanges();

      expect(component.showFilterFields()).toBe(true);
      expect(component.form.get('filterType')?.hasError('required')).toBe(true);
      expect(component.form.get('filterLotNumber')?.hasError('required')).toBe(true);
    });

    it('should show filter fields when docking type is FB', () => {
      component.form.patchValue({ dockingType: DockingType.FB });
      component.onDockingTypeChange(DockingType.FB);
      fixture.detectChanges();

      expect(component.showFilterFields()).toBe(true);
    });

    it('should show filter fields when docking type is BF', () => {
      component.form.patchValue({ dockingType: DockingType.BF });
      component.onDockingTypeChange(DockingType.BF);
      fixture.detectChanges();

      expect(component.showFilterFields()).toBe(true);
    });

    it('should hide filter fields when docking type is BA', () => {
      component.form.patchValue({ dockingType: DockingType.BA });
      component.onDockingTypeChange(DockingType.BA);
      fixture.detectChanges();

      expect(component.showFilterFields()).toBe(false);
      expect(component.form.get('filterType')?.hasError('required')).toBe(false);
      expect(component.form.get('filterLotNumber')?.hasError('required')).toBe(false);
    });

    it('should clear filter fields when switching from filter type to non-filter type', () => {
      component.onDockingTypeChange(DockingType.FI);
      component.form.patchValue({ filterType: 'FT001', filterLotNumber: 'FL001' });

      component.onDockingTypeChange(DockingType.BA);

      expect(component.form.get('filterType')?.value).toBe('');
      expect(component.form.get('filterLotNumber')?.value).toBe('');
    });

    it('should hide filter fields when docking type is SE', () => {
      component.form.patchValue({ dockingType: DockingType.SE });
      component.onDockingTypeChange(DockingType.SE);

      expect(component.showFilterFields()).toBe(false);
    });

    it('should hide filter fields when docking type is NE', () => {
      component.form.patchValue({ dockingType: DockingType.NE });
      component.onDockingTypeChange(DockingType.NE);

      expect(component.showFilterFields()).toBe(false);
    });
  });

  describe('Segment Fields', () => {
    it('should show segment fields only for SE type', () => {
      component.form.patchValue({ dockingType: DockingType.SE });
      expect(component.showSegmentFields()).toBe(true);
    });

    it('should not show segment fields for BA type', () => {
      component.form.patchValue({ dockingType: DockingType.BA });
      expect(component.showSegmentFields()).toBe(false);
    });

    it('should require segment fields for SE type', () => {
      component.onDockingTypeChange(DockingType.SE);

      const segmentRemFlag = component.form.get('segmentRemFlag');
      const segmentNumber = component.form.get('segmentNumber');

      segmentRemFlag?.setValue('');
      segmentNumber?.setValue('');

      expect(segmentRemFlag?.hasError('required')).toBe(true);
      expect(segmentNumber?.hasError('required')).toBe(true);
    });

    it('should clear segment validators for non-SE type', () => {
      component.onDockingTypeChange(DockingType.SE);
      component.onDockingTypeChange(DockingType.BA);

      const segmentRemFlag = component.form.get('segmentRemFlag');
      const segmentNumber = component.form.get('segmentNumber');

      expect(segmentRemFlag?.value).toBe('');
      expect(segmentNumber?.value).toBe('');
      expect(segmentRemFlag?.hasError('required')).toBe(false);
      expect(segmentNumber?.hasError('required')).toBe(false);
    });
  });

  describe('Auto-population', () => {
    it('should auto-populate description when docking type is selected', () => {
      component.dockingTypes = [
        { code: DockingType.BA, description: 'Bag to Bag Docking' }
      ];

      component.onDockingTypeChange(DockingType.BA);

      expect(component.form.get('description')?.value).toBe('Bag to Bag Docking');
    });

    it('should clear description when docking type is cleared', () => {
      component.onDockingTypeChange('' as DockingType);

      expect(component.form.get('description')?.value).toBe('');
    });

    it('should auto-populate attribute description when attribute code is selected', () => {
      component.attributeCodes = [
        { code: '+03', description: 'Test Attribute Description' }
      ];

      component.onAttributeCodeChange('+03');

      expect(component.form.get('attributeDescription')?.value).toBe('Test Attribute Description');
    });

    it('should set empty string if attribute code not found', () => {
      component.attributeCodes = [
        { code: '+03', description: 'Test Attribute Description' }
      ];

      component.onAttributeCodeChange('INVALID');

      expect(component.form.get('attributeDescription')?.value).toBe('');
    });

    it('should clear attribute description when attribute code is empty', () => {
      component.form.patchValue({ attributeDescription: 'Some description' }, { emitEvent: false });

      component.onAttributeCodeChange('');

      expect(component.form.get('attributeDescription')?.value).toBe('');
    });

    it('should handle attribute with empty description', () => {
      component.attributeCodes = [
        { code: 'NODESC', description: '' }
      ];

      component.onAttributeCodeChange('NODESC');

      expect(component.form.get('attributeDescription')?.value).toBe('');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.form.patchValue({
        dockingType: DockingType.BA,
        description: 'Test Description',
        machineCode: '01',
        waferLotNumber: 'WL001',
        numberOfUnits: 5,
        bagCatalogNumber: 'CAT001',
        bagLotNumber: 'BL001',
        numberOfComponents: 3,
        attributeCode: '+03'
      });
    });

    it('should emit submit event with configData and formData when form is valid', (done) => {
      component.submit.subscribe(event => {
        expect(event.configData).toBeDefined();
        expect(event.configData.itemInd).toBe(DockingType.BA);
        expect(event.configData.sterileMachine).toBe('01');
        expect(event.configData.waferLotNumber).toBe('WL001');
        expect(event.configData.numberOfItems).toBe(5);
        expect(event.configData.lotNumber).toBe('BL001');

        expect(event.formData).toBeDefined();
        expect(event.formData.description).toBe('Test Description');
        expect(event.formData.bagCatalogNumber).toBe('CAT001');

        done();
      });

      component.onSubmit();
    });

    it('should not emit when form is invalid', () => {
      const submitSpy = spyOn(component.submit, 'emit');
      component.form.patchValue({ machineCode: '' }); // Make form invalid

      component.onSubmit();

      expect(submitSpy).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when submitting invalid form', () => {
      component.form.patchValue({ machineCode: '' }); // Make form invalid

      component.onSubmit();

      Object.keys(component.form.controls).forEach(key => {
        expect(component.form.get(key)?.touched).toBe(true);
      });
    });

    it('should include disabled fields in getRawValue', () => {
      component.onDockingTypeChange(DockingType.FI);

      expect(component.form.get('numberOfComponents')?.disabled).toBe(true);
      expect(component.form.get('attributeCode')?.disabled).toBe(true);

      const rawValue = component.form.getRawValue();
      expect(rawValue.numberOfComponents).toBe(0);
      expect(rawValue.attributeCode).toBe('');
    });

    it('should not emit and show alert when chapterId is missing', () => {
      headerService.getCurrentChapterId.and.returnValue(null as any);
      const alertSpy = spyOn(window, 'alert');
      const submitSpy = spyOn(component.submit, 'emit');

      component.onSubmit();

      expect(alertSpy).toHaveBeenCalledWith('Chapter ID is required. Please ensure you are logged in.');
      expect(submitSpy).not.toHaveBeenCalled();
    });

    it('should include chapterId in configData', (done) => {
      headerService.getCurrentChapterId.and.returnValue('CH01');

      component.submit.subscribe(event => {
        expect(event.configData.chapterId).toBe('CH01');
        done();
      });

      component.onSubmit();
    });

    it('should include collDate in YYYY-MM-DD format', (done) => {
      component.submit.subscribe(event => {
        expect(event.configData.collDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        done();
      });

      component.onSubmit();
    });

    it('should include processDate in ISO format', (done) => {
      component.submit.subscribe(event => {
        expect(event.configData.processDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
        done();
      });

      component.onSubmit();
    });

    it('should map numberOfUnits to numberOfItems and numberOfUnitsEntered', (done) => {
      component.submit.subscribe(event => {
        expect(event.configData.numberOfItems).toBe(5);
        expect(event.configData.numberOfUnitsEntered).toBe(5);
        done();
      });

      component.onSubmit();
    });

    it('should map machineCode to sterileMachine', (done) => {
      component.submit.subscribe(event => {
        expect(event.configData.sterileMachine).toBe('01');
        done();
      });

      component.onSubmit();
    });

    it('should map bagLotNumber to lotNumber', (done) => {
      component.submit.subscribe(event => {
        expect(event.configData.lotNumber).toBe('BL001');
        done();
      });

      component.onSubmit();
    });

    it('should map bagCatalogNumber to catalogNumber', (done) => {
      component.submit.subscribe(event => {
        expect(event.configData.catalogNumber).toBe('CAT001');
        done();
      });

      component.onSubmit();
    });

    it('should include numberOfComponents as numberOfBags', (done) => {
      component.submit.subscribe(event => {
        expect(event.configData.numberOfBags).toBe(3);
        done();
      });

      component.onSubmit();
    });

    it('should include attributeGroup from attributeCodes lookup', (done) => {
      component.attributeCodes = [
        { code: '+03', description: 'Attribute +03', attributeGroup: 'GRP1' }
      ];

      component.submit.subscribe(event => {
        expect(event.configData.attribGroup).toBe('GRP1');
        done();
      });

      component.onSubmit();
    });

    it('should set attribGroup to empty string when attribute not found', (done) => {
      component.attributeCodes = [];

      component.submit.subscribe(event => {
        expect(event.configData.attribGroup).toBe('');
        done();
      });

      component.onSubmit();
    });

    it('should parse filterType composite value for configData', (done) => {
      component.onDockingTypeChange(DockingType.FB);
      component.form.patchValue({
        dockingType: DockingType.FB,
        filterType: 'HA123::RBC',
        filterLotNumber: 'FL001',
        attributeCode: '+03'
      });

      component.submit.subscribe(event => {
        expect(event.configData.filterType).toBe('HA123');
        expect(event.configData.productType).toBe('RBC');
        done();
      });

      component.onSubmit();
    });

    it('should set productType to undefined when filterType has no separator', (done) => {
      component.form.patchValue({ filterType: '' });

      component.submit.subscribe(event => {
        expect(event.configData.productType).toBeUndefined();
        done();
      });

      component.onSubmit();
    });

    it('should include segmentRemFlag and segmentNumber when set', (done) => {
      component.onDockingTypeChange(DockingType.SE);
      component.form.patchValue({
        dockingType: DockingType.SE,
        segmentRemFlag: 'Y',
        segmentNumber: '5',
        bagLotNumber: 'BL001',
        numberOfUnits: 3
      });

      component.submit.subscribe(event => {
        expect(event.configData.segmentRemFlag).toBe('Y');
        expect(event.configData.segmentNumber).toBe('5');
        done();
      });

      component.onSubmit();
    });

    it('should set segmentRemFlag/segmentNumber to undefined when empty', (done) => {
      component.submit.subscribe(event => {
        expect(event.configData.segmentRemFlag).toBeUndefined();
        expect(event.configData.segmentNumber).toBeUndefined();
        done();
      });

      component.onSubmit();
    });
  });
  describe('Search Functionality', () => {

    it('should return all items when search is empty', (done) => {
      component.machineSearchCtrl.setValue('');

      setTimeout(() => {
        expect(component.filteredMachines.length).toBe(mockMachineCodes.length);
        done();
      }, 350);
    });

    it('should filter machines by code', (done) => {
      component.machineSearchCtrl.setValue('01');

      setTimeout(() => {
        expect(component.filteredMachines.length).toBe(1);
        expect(component.filteredMachines[0].code).toBe('01');
        done();
      }, 350);
    });

    it('should filter machines by description', (done) => {
      component.machineSearchCtrl.setValue('Machine 2');

      setTimeout(() => {
        expect(component.filteredMachines.length).toBe(1);
        expect(component.filteredMachines[0].code).toBe('02');
        done();
      }, 350);
    });

    it('should filter machines case-insensitively', (done) => {
      component.machineSearchCtrl.setValue('machine');

      setTimeout(() => {
        expect(component.filteredMachines.length).toBe(2);
        done();
      }, 350);
    });

    it('should filter wafer lots based on search', (done) => {
      component.waferSearchCtrl.setValue('WL001');

      setTimeout(() => {
        expect(component.filteredWafers.length).toBe(1);
        expect(component.filteredWafers[0].code).toBe('WL001');
        done();
      }, 350);
    });

    it('should return all wafer lots when search is empty', (done) => {
      component.waferSearchCtrl.setValue('');

      setTimeout(() => {
        expect(component.filteredWafers.length).toBe(mockWaferLots.length);
        done();
      }, 350);
    });

    it('should filter catalog numbers based on search', (done) => {
      component.catalogSearchCtrl.setValue('CAT');

      setTimeout(() => {
        expect(component.filteredCatalogs.length).toBe(1);
        done();
      }, 350);
    });

    it('should return all catalogs when search is empty', (done) => {
      component.catalogSearchCtrl.setValue('');

      setTimeout(() => {
        expect(component.filteredCatalogs.length).toBe(mockCatalogNumbers.length);
        done();
      }, 350);
    });

    it('should filter bag lots based on search', (done) => {
      component.lotSearchCtrl.setValue('BL');

      setTimeout(() => {
        expect(component.filteredBagLots.length).toBe(1);
        done();
      }, 350);
    });

    it('should return all bag lots when search is empty', (done) => {
      component.lotSearchCtrl.setValue('');

      setTimeout(() => {
        expect(component.filteredBagLots.length).toBe(mockBagLots.length);
        done();
      }, 350);
    });

    it('should filter attribute codes based on search', (done) => {
      component.attributeSearchCtrl.setValue('+03');

      setTimeout(() => {
        expect(component.filteredAttributes.length).toBe(1);
        expect(component.filteredAttributes[0].code).toBe('+03');
        done();
      }, 350);
    });

    it('should return all attribute codes when search is empty', (done) => {
      component.attributeSearchCtrl.setValue('');

      setTimeout(() => {
        expect(component.filteredAttributes.length).toBe(mockAttributeCodes.length);
        done();
      }, 350);
    });

    it('should filter filter types based on search', (done) => {
      component.filterTypes = mockFilterTypes;
      component.filteredFilterTypes = mockFilterTypes;
      component.filterTypeSearchCtrl.setValue('FT001');

      setTimeout(() => {
        expect(component.filteredFilterTypes.length).toBe(1);
        expect(component.filteredFilterTypes[0].code).toBe('FT001');
        done();
      }, 350);
    });

    it('should return all filter types when search is empty', (done) => {
      component.filterTypes = mockFilterTypes;
      component.filteredFilterTypes = mockFilterTypes;
      component.filterTypeSearchCtrl.setValue('');

      setTimeout(() => {
        expect(component.filteredFilterTypes.length).toBe(mockFilterTypes.length);
        done();
      }, 350);
    });

    it('should filter filter lots based on search', (done) => {
      component.filterLots = mockFilterLots;
      component.filteredFilterLots = mockFilterLots;
      component.filterLotSearchCtrl.setValue('FL001');

      setTimeout(() => {
        expect(component.filteredFilterLots.length).toBe(1);
        done();
      }, 350);
    });

    it('should return all filter lots when search is empty', (done) => {
      component.filterLots = mockFilterLots;
      component.filteredFilterLots = mockFilterLots;
      component.filterLotSearchCtrl.setValue('');

      setTimeout(() => {
        expect(component.filteredFilterLots.length).toBe(mockFilterLots.length);
        done();
      }, 350);
    });

    it('should return empty array when no matches found', (done) => {
      component.machineSearchCtrl.setValue('ZZZZZ_NO_MATCH');

      setTimeout(() => {
        expect(component.filteredMachines.length).toBe(0);
        done();
      }, 350);
    });
  });

  describe('Attribute Code Disable Per Docking Type', () => {

    it('should disable attributeCode for BA', () => {
      component.onDockingTypeChange(DockingType.BA);
      expect(component.form.get('attributeCode')?.disabled).toBe(true);
    });

    it('should disable attributeCode for FI', () => {
      component.onDockingTypeChange(DockingType.FI);
      expect(component.form.get('attributeCode')?.disabled).toBe(true);
    });

    it('should disable attributeCode for SE', () => {
      component.onDockingTypeChange(DockingType.SE);
      expect(component.form.get('attributeCode')?.disabled).toBe(true);
    });

    it('should disable attributeCode for NE', () => {
      component.onDockingTypeChange(DockingType.NE);
      expect(component.form.get('attributeCode')?.disabled).toBe(true);
    });

    it('should enable attributeCode for FB', () => {
      component.onDockingTypeChange(DockingType.FB);
      expect(component.form.get('attributeCode')?.enabled).toBe(true);
    });

    it('should enable attributeCode for BF', () => {
      component.onDockingTypeChange(DockingType.BF);
      expect(component.form.get('attributeCode')?.enabled).toBe(true);
    });

    it('should clear attributeCode value when disabled', () => {
      component.form.patchValue({ attributeCode: '+03' });
      component.onDockingTypeChange(DockingType.BA);
      expect(component.form.get('attributeCode')?.value).toBe('');
    });

    it('should clear attributeDescription when attributeCode is disabled', () => {
      component.form.patchValue({ attributeCode: '+03' });
      component.onAttributeCodeChange('+03');
      expect(component.form.get('attributeDescription')?.value).toBeTruthy();

      component.onDockingTypeChange(DockingType.BA);
      expect(component.form.get('attributeDescription')?.value).toBe('');
    });

    it('should make attributeCode required for FB (error 0114)', () => {
      component.onDockingTypeChange(DockingType.FB);
      const ctrl = component.form.get('attributeCode');
      ctrl?.setValue('');

      expect(ctrl?.hasError('required')).toBe(true);
    });

    it('should make attributeCode required for BF (error 0114)', () => {
      component.onDockingTypeChange(DockingType.BF);
      const ctrl = component.form.get('attributeCode');
      ctrl?.setValue('');

      expect(ctrl?.hasError('required')).toBe(true);
    });

    it('should not require attributeCode for BA', () => {
      component.onDockingTypeChange(DockingType.BA);
      const ctrl = component.form.get('attributeCode');

      expect(ctrl?.hasError('required')).toBeFalsy();
    });
  });
  describe('Number of Components Disable Per Docking Type', () => {

    it('should disable numberOfComponents for FI', () => {
      component.onDockingTypeChange(DockingType.FI);
      expect(component.form.get('numberOfComponents')?.disabled).toBe(true);
    });

    it('should disable numberOfComponents for SE', () => {
      component.onDockingTypeChange(DockingType.SE);
      expect(component.form.get('numberOfComponents')?.disabled).toBe(true);
    });

    it('should disable numberOfComponents for NE', () => {
      component.onDockingTypeChange(DockingType.NE);
      expect(component.form.get('numberOfComponents')?.disabled).toBe(true);
    });

    it('should enable numberOfComponents for BA', () => {
      component.onDockingTypeChange(DockingType.BA);
      expect(component.form.get('numberOfComponents')?.enabled).toBe(true);
    });

    it('should enable numberOfComponents for FB', () => {
      component.onDockingTypeChange(DockingType.FB);
      expect(component.form.get('numberOfComponents')?.enabled).toBe(true);
    });

    it('should enable numberOfComponents for BF', () => {
      component.onDockingTypeChange(DockingType.BF);
      expect(component.form.get('numberOfComponents')?.enabled).toBe(true);
    });

    it('should set numberOfComponents to 0 when disabled', () => {
      component.onDockingTypeChange(DockingType.FI);
      expect(component.form.get('numberOfComponents')?.value).toBe(0);
    });


  });

  describe('Number of Components Validation Per Docking Type', () => {
    it('should enforce min 1 for FB docking type', () => {
      component.onDockingTypeChange(DockingType.FB);
      component.form.patchValue({ numberOfComponents: 0 });

      expect(component.form.get('numberOfComponents')?.valid).toBe(false);
    });

    it('should accept value >= 1 for FB docking type', () => {
      component.onDockingTypeChange(DockingType.FB);
      component.form.patchValue({ numberOfComponents: 1 });

      expect(component.form.get('numberOfComponents')?.valid).toBe(true);
    });

    it('should enforce min 1 for BF docking type', () => {
      component.onDockingTypeChange(DockingType.BF);
      component.form.patchValue({ numberOfComponents: 0 });

      expect(component.form.get('numberOfComponents')?.valid).toBe(false);
    });

    it('should allow 0 for BA docking type', () => {
      component.onDockingTypeChange(DockingType.BA);
      component.form.patchValue({ numberOfComponents: 0 });

      expect(component.form.get('numberOfComponents')?.valid).toBe(true);
    });
  });

  describe('Bag Catalog Number Disable Per Docking Type', () => {
    it('should disable bagCatalogNumber for FI', () => {
      component.onDockingTypeChange(DockingType.FI);
      expect(component.form.get('bagCatalogNumber')?.disabled).toBe(true);
    });

    it('should disable bagCatalogNumber for FB', () => {
      component.onDockingTypeChange(DockingType.FB);
      expect(component.form.get('bagCatalogNumber')?.disabled).toBe(true);
    });

    it('should disable bagCatalogNumber for SE', () => {
      component.onDockingTypeChange(DockingType.SE);
      expect(component.form.get('bagCatalogNumber')?.disabled).toBe(true);
    });

    it('should disable bagCatalogNumber for NE', () => {
      component.onDockingTypeChange(DockingType.NE);
      expect(component.form.get('bagCatalogNumber')?.disabled).toBe(true);
    });

    it('should enable bagCatalogNumber for BA', () => {
      component.onDockingTypeChange(DockingType.BA);
      expect(component.form.get('bagCatalogNumber')?.enabled).toBe(true);
    });

    it('should enable bagCatalogNumber for BF', () => {
      component.onDockingTypeChange(DockingType.BF);
      expect(component.form.get('bagCatalogNumber')?.enabled).toBe(true);
    });

    it('should clear bagCatalogNumber value when disabled', () => {
      component.form.patchValue({ bagCatalogNumber: 'CAT001' });
      component.onDockingTypeChange(DockingType.FI);
      expect(component.form.get('bagCatalogNumber')?.value).toBe('');
    });
  });

  describe('Bag Lot Number Disable Per Docking Type', () => {
    it('should disable bagLotNumber for FI', () => {
      component.onDockingTypeChange(DockingType.FI);
      expect(component.form.get('bagLotNumber')?.disabled).toBe(true);
    });

    it('should disable bagLotNumber for FB', () => {
      component.onDockingTypeChange(DockingType.FB);
      expect(component.form.get('bagLotNumber')?.disabled).toBe(true);
    });

    it('should enable bagLotNumber for BA', () => {
      component.onDockingTypeChange(DockingType.BA);
      expect(component.form.get('bagLotNumber')?.enabled).toBe(true);
    });

    it('should enable bagLotNumber for SE', () => {
      component.onDockingTypeChange(DockingType.SE);
      expect(component.form.get('bagLotNumber')?.enabled).toBe(true);
    });

    it('should enable bagLotNumber for NE', () => {
      component.onDockingTypeChange(DockingType.NE);
      expect(component.form.get('bagLotNumber')?.enabled).toBe(true);
    });

    it('should enable bagLotNumber for BF', () => {
      component.onDockingTypeChange(DockingType.BF);
      expect(component.form.get('bagLotNumber')?.enabled).toBe(true);
    });

    it('should clear bagLotNumber value when disabled', () => {
      component.form.patchValue({ bagLotNumber: 'BL001' });
      component.onDockingTypeChange(DockingType.FI);
      expect(component.form.get('bagLotNumber')?.value).toBe('');
    });
  });

  describe('Filter Type Selection with Product Type', () => {
    it('should extract product type from composite value and reload attribute codes', () => {
      component.form.patchValue({ dockingType: 'FB' });
      lovService.getFilteredDropdowns.and.returnValue(of({
        attributeCodes: [{ code: '+01', description: 'Washed' }]
      }));

      component.onFilterTypeSelectionChange('HA1234567::RBC');

      expect(lovService.getFilteredDropdowns).toHaveBeenCalledWith('FB', undefined, 'RBC');
    });

    it('should clear attributeCodes when composite value is empty', () => {
      component.attributeCodes = [{ code: '+01', description: 'Test' }];
      component.filteredAttributes = [{ code: '+01', description: 'Test' }];

      component.onFilterTypeSelectionChange('');

      expect(component.attributeCodes).toEqual([]);
      expect(component.filteredAttributes).toEqual([]);
    });

    it('should reset filterLotNumber, attributeCode, and attributeDescription on filter type change', () => {
      component.form.patchValue({
        filterLotNumber: 'FL001',
        attributeCode: '+03'
      }, { emitEvent: false });
      component.form.patchValue({ attributeDescription: 'Desc' }, { emitEvent: false });

      component.onFilterTypeSelectionChange('HA1234567::RBC');

      expect(component.form.get('filterLotNumber')?.value).toBe('');
      expect(component.form.get('attributeCode')?.value).toBe('');
      expect(component.form.get('attributeDescription')?.value).toBe('');
    });

    it('should update attributeCodes from reloadAttributeCodesForFilterType response', () => {
      component.form.patchValue({ dockingType: 'FB' });
      lovService.getFilteredDropdowns.and.returnValue(of({
        attributeCodes: [{ code: '+05', description: 'Irradiated' }]
      }));

      component.onFilterTypeSelectionChange('HA1234567::PLT');

      expect(component.attributeCodes.length).toBe(1);
      expect(component.attributeCodes[0].code).toBe('+05');
      expect(component.filteredAttributes).toEqual(component.attributeCodes);
    });

    it('should display only code in trigger (not product type)', () => {
      component.form.patchValue({ filterType: 'HA1234567::RBC' });

      expect(component.getFilterTypeDisplay()).toBe('HA1234567');
    });

    it('should extract code from composite value on submit', () => {
      expect(component['parseFilterTypeValue']('HA1234567::RBC')).toEqual({ code: 'HA1234567', productType: 'RBC' });
    });

    it('should handle plain code without :: separator', () => {
      expect(component['parseFilterTypeValue']('HA1234567')).toEqual({ code: 'HA1234567', productType: '' });
    });

    it('should return empty string for getFilterTypeDisplay when filterType is empty', () => {
      component.form.patchValue({ filterType: '' });
      expect(component.getFilterTypeDisplay()).toBe('');
    });

    it('should not reload attribute codes when dockingType is empty', () => {
      component.form.patchValue({ dockingType: '' });
      lovService.getFilteredDropdowns.calls.reset();

      component.onFilterTypeSelectionChange('HA1234567::RBC');

      expect(lovService.getFilteredDropdowns).not.toHaveBeenCalled();
    });
  });
  describe('Cascading Dropdowns', () => {
    it('should reload catalog numbers and lot numbers when docking type changes', () => {
      component.onDockingTypeChange(DockingType.BA);

      expect(lovService.getFilteredDropdowns).toHaveBeenCalledWith(DockingType.BA);
    });

    it('should update catalogNumbers and bagLots from filtered response', () => {
      lovService.getFilteredDropdowns.and.returnValue(of({
        catalogNumbers: [{ code: 'FILTERED_CAT', description: '' }],
        bagLots: [{ code: 'FILTERED_LOT', description: '' }]
      }));

      component.onDockingTypeChange(DockingType.BA);

      expect(component.catalogNumbers.length).toBe(1);
      expect(component.catalogNumbers[0].code).toBe('FILTERED_CAT');
      expect(component.bagLots.length).toBe(1);
      expect(component.bagLots[0].code).toBe('FILTERED_LOT');
    });

    it('should update filterTypes when returned in filtered response', () => {
      lovService.getFilteredDropdowns.and.returnValue(of({
        catalogNumbers: [],
        bagLots: [],
        filterTypes: mockFilterTypes
      }));

      component.onDockingTypeChange(DockingType.FI);

      expect(component.filterTypes).toEqual(mockFilterTypes);
      expect(component.filteredFilterTypes).toEqual(mockFilterTypes);
    });

    it('should update filterLots when returned in filtered response', () => {
      lovService.getFilteredDropdowns.and.returnValue(of({
        catalogNumbers: [],
        bagLots: [],
        filterLots: mockFilterLots
      }));

      component.onDockingTypeChange(DockingType.FI);

      expect(component.filterLots).toEqual(mockFilterLots);
      expect(component.filteredFilterLots).toEqual(mockFilterLots);
    });

    it('should update waferLots when returned non-empty in filtered response', () => {
      const updatedWaferLots = [{ code: 'WL_NEW', description: 'New Wafer' }];
      lovService.getFilteredDropdowns.and.returnValue(of({
        catalogNumbers: [],
        bagLots: [],
        waferLots: updatedWaferLots
      }));

      component.onDockingTypeChange(DockingType.BA);

      expect(component.waferLots).toEqual(updatedWaferLots);
      expect(component.filteredWafers).toEqual(updatedWaferLots);
    });

    it('should not update waferLots when returned as empty array', () => {
      const originalWafers = [...component.waferLots];
      lovService.getFilteredDropdowns.and.returnValue(of({
        catalogNumbers: [],
        bagLots: [],
        waferLots: []
      }));

      component.onDockingTypeChange(DockingType.BA);

      expect(component.waferLots).toEqual(originalWafers);
    });

    it('should clear attributeCodes and reset form fields on docking type change', () => {
      component.attributeCodes = [{ code: '+03', description: 'Test' }];

      component.onDockingTypeChange(DockingType.BA);

      expect(component.attributeCodes).toEqual([]);
      expect(component.filteredAttributes).toEqual([]);
    });

    it('should reload lot numbers when catalog number changes', () => {
      component.form.patchValue({ dockingType: DockingType.BA });
      lovService.getFilteredDropdowns.calls.reset();

      component.form.patchValue({ bagCatalogNumber: 'CAT001' });

      expect(lovService.getFilteredDropdowns).toHaveBeenCalledWith(DockingType.BA, 'CAT001');
    });

    it('should reset bagLotNumber when catalog number changes', () => {
      component.form.patchValue({ dockingType: DockingType.BA, bagLotNumber: 'OLD_LOT' });

      component.form.patchValue({ bagCatalogNumber: 'CAT001' });

      expect(component.form.get('bagLotNumber')?.value).toBe('');
    });

    it('should cancel previous dropdown reload when docking type changes rapidly', () => {
      lovService.getFilteredDropdowns.calls.reset();

      component.onDockingTypeChange(DockingType.BA);
      component.onDockingTypeChange(DockingType.FB);

      expect(lovService.getFilteredDropdowns).toHaveBeenCalledTimes(2);
    });

    it('should not call getFilteredDropdowns when catalog changes but dockingType is empty', () => {
      component.form.patchValue({ dockingType: '' });
      lovService.getFilteredDropdowns.calls.reset();

      component.form.patchValue({ bagCatalogNumber: 'CAT001' });

      expect(lovService.getFilteredDropdowns).not.toHaveBeenCalled();
    });

    it('should not call getFilteredDropdowns when catalog changes but catalog is empty', () => {
      component.form.patchValue({ dockingType: DockingType.BA });
      lovService.getFilteredDropdowns.calls.reset();

      component.form.patchValue({ bagCatalogNumber: '' });

      expect(lovService.getFilteredDropdowns).not.toHaveBeenCalled();
    });

    it('should not call getFilteredDropdowns when docking type is empty string', () => {
      lovService.getFilteredDropdowns.calls.reset();

      component.onDockingTypeChange('' as DockingType);

      expect(lovService.getFilteredDropdowns).not.toHaveBeenCalled();
    });
  });
  describe('SE Docking Type Navigation', () => {
    it('should disable Filter Type, Filter Lot, Number of Components, Attribute Code for SE', () => {
      component.onDockingTypeChange(DockingType.SE);

      expect(component.showFilterFields()).toBe(false);
      expect(component.form.get('numberOfComponents')?.disabled).toBe(true);
      expect(component.form.get('attributeCode')?.disabled).toBe(true);
      expect(component.form.get('bagCatalogNumber')?.disabled).toBe(true);
    });

    it('should keep Bag Lot Number enabled for SE', () => {
      component.onDockingTypeChange(DockingType.SE);

      expect(component.form.get('bagLotNumber')?.disabled).toBe(false);
    });

    it('should show segment fields for SE', () => {
      component.form.patchValue({ dockingType: DockingType.SE });
      component.onDockingTypeChange(DockingType.SE);

      expect(component.showSegmentFields()).toBe(true);
    });
  });

  describe('NE Docking Type Navigation', () => {
    it('should disable Filter Type, Filter Lot, Number of Components, Attribute Code for NE', () => {
      component.onDockingTypeChange(DockingType.NE);

      expect(component.showFilterFields()).toBe(false);
      expect(component.form.get('numberOfComponents')?.disabled).toBe(true);
      expect(component.form.get('attributeCode')?.disabled).toBe(true);
    });

    it('should disable bagCatalogNumber for NE', () => {
      component.onDockingTypeChange(DockingType.NE);
      expect(component.form.get('bagCatalogNumber')?.disabled).toBe(true);
    });

    it('should not show segment fields for NE', () => {
      component.form.patchValue({ dockingType: DockingType.NE });
      component.onDockingTypeChange(DockingType.NE);

      expect(component.showSegmentFields()).toBe(false);
    });
  });

  describe('Docking Type Search', () => {
    it('should filter docking types based on search input', (done) => {
      component.dockingTypeSearchCtrl.setValue('Bag');

      setTimeout(() => {
        expect(component.filteredDockingTypes.length).toBeGreaterThan(0);
        expect(component.filteredDockingTypes.every(
          t => t.code.toLowerCase().includes('bag') || t.description?.toLowerCase().includes('bag')
        )).toBe(true);
        done();
      }, 350);
    });

    it('should return all docking types when search is empty', (done) => {
      component.dockingTypeSearchCtrl.setValue('');

      setTimeout(() => {
        expect(component.filteredDockingTypes.length).toBe(mockDockingTypes.length);
        done();
      }, 350);
    });

    it('should filter docking types by code', (done) => {
      component.dockingTypeSearchCtrl.setValue('BA');

      setTimeout(() => {
        expect(component.filteredDockingTypes.some(t => t.code === DockingType.BA)).toBe(true);
        done();
      }, 350);
    });

    it('should return no results when search matches nothing', (done) => {
      component.dockingTypeSearchCtrl.setValue('ZZZZZ_NOMATCH');

      setTimeout(() => {
        expect(component.filteredDockingTypes.length).toBe(0);
        done();
      }, 350);
    });
  });
  describe('Number Validation', () => {
    it('should accept valid positive integers for numberOfUnits', () => {
      component.form.patchValue({ numberOfUnits: 10 });
      expect(component.form.get('numberOfUnits')?.valid).toBe(true);
    });

    it('should reject negative numbers for numberOfUnits', () => {
      component.form.patchValue({ numberOfUnits: -5 });
      expect(component.form.get('numberOfUnits')?.valid).toBe(false);
    });

    it('should reject zero for numberOfUnits', () => {
      component.form.patchValue({ numberOfUnits: 0 });
      expect(component.form.get('numberOfUnits')?.valid).toBe(false);
    });

    it('should accept 1 as minimum valid numberOfUnits', () => {
      component.form.patchValue({ numberOfUnits: 1 });
      expect(component.form.get('numberOfUnits')?.valid).toBe(true);
    });

    it('should accept 999 as maximum valid numberOfUnits', () => {
      component.form.patchValue({ numberOfUnits: 999 });
      expect(component.form.get('numberOfUnits')?.valid).toBe(true);
    });

    it('should reject numberOfUnits above 999', () => {
      component.form.patchValue({ numberOfUnits: 1000 });
      expect(component.form.get('numberOfUnits')?.valid).toBe(false);
    });

    it('should accept valid positive integers for numberOfComponents', () => {
      component.form.patchValue({ numberOfComponents: 5 });
      expect(component.form.get('numberOfComponents')?.valid).toBe(true);
    });

    it('should reject null for numberOfUnits', () => {
      component.form.patchValue({ numberOfUnits: null });
      expect(component.form.get('numberOfUnits')?.valid).toBe(false);
    });
  });

  describe('Process Date Focus Trigger', () => {

    it('should call onSubmit when form is valid and process date is focused', () => {
      component.form.patchValue({
        dockingType: DockingType.BA,
        machineCode: '01',
        waferLotNumber: 'WL001',
        numberOfUnits: 5,
        bagCatalogNumber: 'CAT001',
        bagLotNumber: 'BL001',
        numberOfComponents: 3
      });
      const submitSpy = spyOn(component.submit, 'emit');

      component.onProcessDateFocus();

      expect(submitSpy).toHaveBeenCalled();
    });

    it('should mark all fields as touched when focused with invalid form', () => {
      component.form.patchValue({ machineCode: '' }); // Invalid

      component.onProcessDateFocus();

      Object.keys(component.form.controls).forEach(key => {
        expect(component.form.get(key)?.touched).toBe(true);
      });
    });

    it('should show snackbar error when focused with invalid form', () => {
      component.form.patchValue({ machineCode: '' });

      component.onProcessDateFocus();

      expect(snackbarService.showError).toHaveBeenCalledWith('Please complete all required fields before proceeding');
    });

    it('should not show error when form is valid', () => {
      component.form.patchValue({
        dockingType: DockingType.BA,
        machineCode: '01',
        waferLotNumber: 'WL001',
        numberOfUnits: 5,
        bagCatalogNumber: 'CAT001',
        bagLotNumber: 'BL001',
        numberOfComponents: 3
      });
      snackbarService.showError.calls.reset();

      component.onProcessDateFocus();

      expect(snackbarService.showError).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      const cancelSpy = spyOn(component.cancel, 'emit');

      component.onCancel();

      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('onSegmentNumberAdvance', () => {
    it('should prevent default event and focus process date input', () => {
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault']);
      const mockElement = { focus: jasmine.createSpy('focus') };
      component.processDateInput = { nativeElement: mockElement } as any;

      component.onSegmentNumberAdvance(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockElement.focus).toHaveBeenCalled();
    });

    it('should prevent default even when processDateInput is not set', () => {
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault']);
      component.processDateInput = undefined;

      component.onSegmentNumberAdvance(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('getFieldError', () => {
    it('should return empty string for untouched field', () => {
      expect(component.getFieldError('dockingType')).toBe('');
    });

    it('should return error message for touched required field', () => {
      const ctrl = component.form.get('dockingType');
      ctrl?.setValue('');
      ctrl?.markAsTouched();

      const error = component.getFieldError('dockingType');
      expect(error).toBeTruthy();
    });

    it('should use fieldLabels mapping for error messages', () => {
      const ctrl = component.form.get('machineCode');
      ctrl?.setValue('');
      ctrl?.markAsTouched();

      const error = component.getFieldError('machineCode');
      expect(error).toContain('Machine Code');
    });

    it('should use fieldName as fallback when no label mapping exists', () => {
      // Access a non-existent field to get default behavior
      const error = component.getFieldError('nonexistentField');
      expect(error).toBe('');
    });
  });

  describe('Catalog Barcode Scan', () => {
    it('should patch catalogNumber on successful scan', () => {
      lovService.parseCatalogBarcode.and.returnValue(of({
        success: true,
        catalogNumber: 'CAT123',
        scanMode: 'ISBT'
      }));

      component.onCatalogBarcodeScan('=+CAT123');

      expect(component.form.get('bagCatalogNumber')?.value).toBe('CAT123');
    });

    it('should patch lotNumber on successful scan', () => {
      lovService.parseCatalogBarcode.and.returnValue(of({
        success: true,
        lotNumber: 'LOT456',
        scanMode: 'ISBT'
      }));

      component.onCatalogBarcodeScan('=+LOT456');

      expect(component.form.get('bagLotNumber')?.value).toBe('LOT456');
    });

    it('should patch both catalogNumber and lotNumber when both present', () => {
      lovService.parseCatalogBarcode.and.returnValue(of({
        success: true,
        catalogNumber: 'CAT789',
        lotNumber: 'LOT789',
        scanMode: 'ISBT'
      }));

      component.onCatalogBarcodeScan('=+CAT789LOT789');

      expect(component.form.get('bagCatalogNumber')?.value).toBe('CAT789');
      expect(component.form.get('bagLotNumber')?.value).toBe('LOT789');
    });

    it('should show error snackbar on unsuccessful scan', () => {
      lovService.parseCatalogBarcode.and.returnValue(of({
        success: false,
        errorMessage: 'Invalid ISBT format',
        scanMode: 'ISBT'
      }));

      component.onCatalogBarcodeScan('INVALID');

      expect(snackbarService.showError).toHaveBeenCalledWith('Invalid ISBT format');
    });

    it('should show default error message when errorMessage is empty', () => {
      lovService.parseCatalogBarcode.and.returnValue(of({
        success: false,
        errorMessage: '',
        scanMode: 'ISBT'
      }));

      component.onCatalogBarcodeScan('INVALID');

      expect(snackbarService.showError).toHaveBeenCalledWith('Invalid barcode format');
    });

    it('should show error snackbar on service error', () => {
      lovService.parseCatalogBarcode.and.returnValue(throwError(() => new Error('Network error')));

      component.onCatalogBarcodeScan('=+CAT123');

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to parse barcode');
    });

    it('should do nothing when scan value is empty string', () => {
      component.onCatalogBarcodeScan('');

      expect(lovService.parseCatalogBarcode).not.toHaveBeenCalled();
    });

    it('should do nothing when scan value is whitespace only', () => {
      component.onCatalogBarcodeScan('   ');

      expect(lovService.parseCatalogBarcode).not.toHaveBeenCalled();
    });
  });

  describe('Chapter Changes', () => {
    it('should reset form and reload LOVs on chapter change', () => {
      const chapterChanged$ = new Subject<void>();
      headerService.chapterChanged$ = chapterChanged$.asObservable();

      // Re-create component with the subscribable subject
      const newFixture = TestBed.createComponent(ConfigurationFormComponent);
      const newComponent = newFixture.componentInstance;
      lovService.getDockingTypes.calls.reset();
      lovService.getMachineCodes.calls.reset();
      newFixture.detectChanges();

      // Emit chapter change
      chapterChanged$.next();

      expect(lovService.getDockingTypes).toHaveBeenCalledTimes(2); // Once on init, once on change
      expect(lovService.getMachineCodes).toHaveBeenCalledTimes(2);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Process Date / Timezone', () => {
    it('should use chapter timezone when available', () => {
      headerService.getCurrentChapterTimezone.and.returnValue('-05:00');
      // Force set process date
      component['setProcessDate']();

      const processDate = component.form.get('processDate')?.value;
      expect(processDate).toMatch(/^\d{2}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('should fall back to local time when no chapter timezone', () => {
      headerService.getCurrentChapterTimezone.and.returnValue(null as any);
      component['setProcessDate']();

      const processDate = component.form.get('processDate')?.value;
      expect(processDate).toMatch(/^\d{2}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('should not set process date if form is not initialized', () => {
      const origForm = component.form;
      (component as any).form = undefined;
      expect(() => component['setProcessDate']()).not.toThrow();
      (component as any).form = origForm;
    });
  });

  describe('showFilterFields and showSegmentFields edge cases', () => {
    it('should return false for showFilterFields when dockingType has no value', () => {
      component.form.patchValue({ dockingType: '' });
      expect(component.showFilterFields()).toBe(false);
    });

    it('should return false for showSegmentFields when dockingType has no value', () => {
      component.form.patchValue({ dockingType: '' });
      expect(component.showSegmentFields()).toBe(false);
    });
  });
});
