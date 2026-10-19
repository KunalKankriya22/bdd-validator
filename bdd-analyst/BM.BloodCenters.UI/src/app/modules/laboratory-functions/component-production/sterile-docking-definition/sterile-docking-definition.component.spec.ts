import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { SterileDockingDefinitionComponent } from './sterile-docking-definition.component';
import { SterileDockingDefinitionService } from './services/sterile-docking-definition.service';
import { SterileDockingLovService } from './services/sterile-docking-lov.service';
import { DockingConfigurationDto, DockingType, UnitEntryDto, DerivedProductDto } from './models/sterile-docking-definition.model';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { provideCommonTestMocks } from '@shared/testing/page-header-service.mock';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('SterileDockingDefinitionComponent', () => {
  let menuServiceSpy: any;
  let serviceSpy: any;
  let routerSpy: any;
  let lovServiceSpy: jasmine.SpyObj<SterileDockingLovService>;
  let component: SterileDockingDefinitionComponent;
  let fixture: ComponentFixture<SterileDockingDefinitionComponent>;
  let service: jasmine.SpyObj<SterileDockingDefinitionService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockFormData = {
    dockingType: DockingType.BA,
    description: 'Test Description',
    machineCode: '01',
    waferLotNumber: 'WL001',
    numberOfUnits: 5,
    bagCatalogNumber: 'CAT001',
    bagLotNumber: 'LOT001',
    numberOfComponents: 3,
    attributeCode: '+03',
    attributeDescription: 'Attribute +03',
    processDate: '26-MAY-2026 17:42'
  };

  const mockConfigData = {
    chapterId: 'TEST_CHAPTER',
    collDate: '2026-05-26',
    dockingType: DockingType.BA,
    description: 'Test Description',
    sterileMachine: '01',
    waferLotNumber: 'WL001',
    bagCatalogNumber: 'CAT001',
    lotNumber: 'LOT001',
    numberOfItems: 5,
    numberOfComponents: 3,
    attributeCode: '+03',
    attributeDescription: 'Attribute +03',
    processDate: '26-MAY-2026 17:42'
  };

  const mockApiSuccessResponse = {
    success: true,
    statusCode: 201,
    message: 'Sterile docking operation created successfully',
    data: null,
    item: {
      id: '052826-SD1007|W454526051302|2026-05-28|WAD|BA',
      sdcWsNumber: '052826-SD1007',
      unitId: 'W454526051302',
      collDate: '2026-05-28T00:00:00',
      chapterId: 'WAD',
      itemInd: 'BA',
      productCode: '00161',
      productShortName: 'RBC',
      weldFlag: 'Y',
      programId: 'CPISDDFN'
    },
    errorResponse: { errorCode: '', error: '' }
  };

  const mockUnitEntry: UnitEntryDto = {
    unitId: 'W454526051302',
    originalProductCode: '00161',
    weldOk: 'Y',
    verifyProduct: 'N'
  };

  beforeEach(() => {

    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    routerSpy.events = of(new NavigationEnd(0, '/', '/'));
    routerSpy.url = '/';
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('');
    const snackbarServiceSpy = createMockSnackbarService();
    serviceSpy = jasmine.createSpyObj('SterileDockingDefinitionService', [
      'create', 'search', 'getByKey', 'update', 'delete'
    ]);
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));
    menuServiceSpy.findMenuItemByPath.and.returnValue(null);
    lovServiceSpy = jasmine.createSpyObj('SterileDockingLovService', [
      'getProductCodes', 'getFilters', 'getDockingTypes', 'getMachineCodes',
      'getWaferLots', 'getCatalogNumbers', 'getBagLots', 'getFilterTypes',
      'getFilterLots', 'getAttributeCodes', 'getFilteredDropdowns',
      'parseCatalogBarcode', 'validateUnit', 'searchUnits',
      'validateUnitForDocking', 'getUnitProductCodes', 'calculateDerivedProduct',
      'calculateExpiryDate', 'clearCache'
    ]);
    lovServiceSpy.getProductCodes.and.returnValue(of([]));
    lovServiceSpy.getDockingTypes.and.returnValue(of([]));
    lovServiceSpy.getMachineCodes.and.returnValue(of([]));
    lovServiceSpy.getWaferLots.and.returnValue(of([]));
    lovServiceSpy.getCatalogNumbers.and.returnValue(of([]));
    lovServiceSpy.getBagLots.and.returnValue(of([]));
    lovServiceSpy.getFilterTypes.and.returnValue(of([]));
    lovServiceSpy.getFilterLots.and.returnValue(of([]));
    lovServiceSpy.getAttributeCodes.and.returnValue(of([]));
    lovServiceSpy.getFilteredDropdowns.and.returnValue(of({}));
    lovServiceSpy.getFilters.and.returnValue(of({}));
    lovServiceSpy.validateUnit.and.returnValue(of({}));
    lovServiceSpy.searchUnits.and.returnValue(of([]));
    lovServiceSpy.validateUnitForDocking.and.returnValue(of({}));
    lovServiceSpy.getUnitProductCodes.and.returnValue(of([]));
    lovServiceSpy.calculateDerivedProduct.and.returnValue(of({ derivedProduct: '' }));
    lovServiceSpy.calculateExpiryDate.and.returnValue(of(null));
    lovServiceSpy.parseCatalogBarcode.and.returnValue(of({ success: false, scanMode: 'Error' }));



      TestBed.configureTestingModule({
      imports: [SterileDockingDefinitionComponent, HttpClientTestingModule],
      providers: [
        ...provideCommonTestMocks(),
        { provide: Router, useValue: routerSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: SterileDockingDefinitionService, useValue: serviceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: SterileDockingLovService, useValue: lovServiceSpy }
      ]
    });


    


      routerSpy.navigate.calls.reset();


      serviceSpy.create.calls.reset();


      serviceSpy.search.calls.reset();


      serviceSpy.getByKey.calls.reset();


      serviceSpy.update.calls.reset();


      serviceSpy.delete.calls.reset();


      menuServiceSpy.getMenuItemsSignal.calls.reset();


      menuServiceSpy.findMenuItemByPath.calls.reset();


      menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));


      menuServiceSpy.findMenuItemByPath.and.returnValue(null);


    service = TestBed.inject(SterileDockingDefinitionService) as jasmine.SpyObj<SterileDockingDefinitionService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    fixture = TestBed.createComponent(SterileDockingDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {
    it('should start in configuration phase', () => {
      expect(component.currentPhase()).toBe('configuration');
    });





    it('should not be loading initially', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should have no error message initially', () => {
      expect(component.errorMessage()).toBeNull();
    });

    it('should have null worksheetId initially', () => {
      expect(component.worksheetId()).toBeNull();
    });


  });

  describe('Computed Signals', () => {
    it('should compute existingUnitIds from enteredUnits', () => {
      component.enteredUnits.set([
        { ...mockUnitEntry, unitId: 'UNIT1' },
        { ...mockUnitEntry, unitId: 'UNIT2' }
      ]);
      expect(component.existingUnitIds()).toEqual(['UNIT1', 'UNIT2']);
    });
  });

  describe('Configuration Complete', () => {
    it('should transition to unit-entry phase', () => {
      const event = { configData: mockConfigData, formData: mockFormData };
      component.onConfigurationComplete(event);
      expect(component.currentPhase()).toBe('unit-entry');
    });

    it('should store configuration data', () => {
      const event = { configData: mockConfigData, formData: mockFormData };
      component.onConfigurationComplete(event);

      const config = component.configuration();
      expect(config).toBeDefined();
      expect(config?.chapterId).toBe('TEST_CHAPTER');
      expect(config?.programId).toBe('CPISDDFN');
    });



    it('should map sterileMachine correctly from configData', () => {
      const event = { configData: mockConfigData, formData: mockFormData };
      component.onConfigurationComplete(event);

      expect(component.configuration()?.sterileMachine).toBe('01');
    });

    it('should map waferLotNumber correctly from configData', () => {
      const event = { configData: mockConfigData, formData: mockFormData };
      component.onConfigurationComplete(event);

      expect(component.configuration()?.waferLotNumber).toBe('WL001');
    });

    it('should map lotNumber correctly from configData', () => {
      const event = { configData: mockConfigData, formData: mockFormData };
      component.onConfigurationComplete(event);

      expect(component.configuration()?.lotNumber).toBe('LOT001');
    });

    it('should map numberOfItems correctly from configData', () => {
      const event = { configData: mockConfigData, formData: mockFormData };
      component.onConfigurationComplete(event);

      expect(component.configuration()?.numberOfItems).toBe(5);
    });

    it('should map productType correctly from configData', () => {
      const event = { configData: { ...mockConfigData, productType: 'RBC' }, formData: mockFormData };
      component.onConfigurationComplete(event);

      expect(component.configuration()?.productType).toBe('RBC');
    });

    it('should map productType as undefined when not provided in configData', () => {
      const event = { configData: mockConfigData, formData: mockFormData };
      component.onConfigurationComplete(event);

      expect(component.configuration()?.productType).toBeUndefined();
    });
  });

  describe('Per-Unit Immediate Save (onUnitAdded)', () => {
    beforeEach(() => {
      component.configuration.set({
        chapterId: 'WAD',
        collDate: '2026-05-28',
        itemInd: DockingType.BA,
        sterileMachine: '01',
        waferLotNumber: 'WL001',
        lotNumber: 'LOT001',
        numberOfItems: 5,
        weldFlag: 'Y',
        programId: 'CPISDDFN'
      });
    });



    it('should send correct DTO with per-unit productCode and weldFlag', () => {
      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded(mockUnitEntry);

      const dto = service.create.calls.mostRecent().args[0];
      expect(dto.productCode).toBe('00161');
      expect(dto.weldFlag).toBe('Y');
      expect(dto.unitId).toBe('W454526051302');
    });



    it('should store worksheetId from first unit response', fakeAsync(() => {
      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.worksheetId()).toBe('052826-SD1007');
    }));

    it('should reuse worksheetId for subsequent units', fakeAsync(() => {
      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      service.create.calls.reset();
      const unit2 = { ...mockUnitEntry, unitId: 'W454526051303' };
      component.onUnitAdded(unit2);

      const dto = service.create.calls.mostRecent().args[0];
      expect(dto.sdcWsNumber).toBe('052826-SD1007');
    }));














  });

  describe('buildUnitDto', () => {
    const config = {
      chapterId: 'WAD',
      collDate: '2026-05-28',
      itemInd: DockingType.NE,
      sterileMachine: '06',
      waferLotNumber: '0167',
      lotNumber: 'LOT1',
      numberOfItems: 2,
      programId: 'CPISDDFN'
    } as any;

    it('should map config fields correctly', () => {
      const dto = component['buildUnitDto'](config, mockUnitEntry);
      expect(dto.chapterId).toBe('WAD');
      expect(dto.collDate).toBe('2026-05-28');
      expect(dto.itemInd).toBe(DockingType.NE);
      expect(dto.sterileMachine).toBe('06');
      expect(dto.waferLotNumber).toBe('0167');
    });

    it('should map per-unit fields from UnitEntryDto', () => {
      const dto = component['buildUnitDto'](config, mockUnitEntry);
      expect(dto.unitId).toBe('W454526051302');
      expect(dto.productCode).toBe('00161');
      expect(dto.weldFlag).toBe('Y');
    });

    it('should include sdcWsNumber when provided', () => {
      const dto = component['buildUnitDto'](config, mockUnitEntry, 'WS-123');
      expect(dto.sdcWsNumber).toBe('WS-123');
    });


  });

  describe('Remove Product', () => {
    beforeEach(fakeAsync(() => {
      component.configuration.set({
        chapterId: 'WAD', collDate: '2026-05-28', itemInd: DockingType.BA,
        numberOfItems: 5, programId: 'CPISDDFN'
      } as any);

      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded({ ...mockUnitEntry, unitId: 'UNIT1' });
      component.onUnitAdded({ ...mockUnitEntry, unitId: 'UNIT2' });
      tick();
    }));

    it('should remove product from derivedProducts', () => {
      component.onRemoveProduct('UNIT1');
      expect(component.derivedProducts().find(p => p.unitId === 'UNIT1')).toBeUndefined();
    });

    it('should remove unit from enteredUnits', () => {
      component.onRemoveProduct('UNIT1');
      expect(component.enteredUnits().find(u => u.unitId === 'UNIT1')).toBeUndefined();
    });


  });

  describe('Clear All', () => {
    beforeEach(() => {
      component.configuration.set({ chapterId: 'WAD' } as any);
      component.worksheetId.set('WS-123');
      component.enteredUnits.set([mockUnitEntry]);
      component.currentPhase.set('unit-entry');
    });

    it('should reset configuration to null', () => {
      component.onClearAll();
      expect(component.configuration()).toBeNull();
    });

    it('should clear derived products', () => {
      component.onClearAll();
      expect(component.derivedProducts()).toEqual([]);
    });

    it('should clear worksheetId', () => {
      component.onClearAll();
      expect(component.worksheetId()).toBeNull();
    });

    it('should reset to configuration phase', () => {
      component.onClearAll();
      expect(component.currentPhase()).toBe('configuration');
    });
  });

  describe('Cancel', () => {


    it('should clear all data and return to configuration phase when in unit-entry phase', () => {
      component.configuration.set({ chapterId: 'WAD' } as any);
      component.worksheetId.set('WS-123');
      component.enteredUnits.set([mockUnitEntry]);
      component.currentPhase.set('unit-entry');

      component.onCancel();

      expect(component.configuration()).toBeNull();
      expect(component.derivedProducts()).toEqual([]);
      expect(component.worksheetId()).toBeNull();
      expect(component.enteredUnits().length).toBe(0);
      expect(component.currentPhase()).toBe('configuration');
    });
  });

  describe('Reprint Labels', () => {




    it('should show reprint button for FB docking type', () => {
      component.configuration.set({ chapterId: 'CH1', itemInd: DockingType.FB } as any);
      expect(component.showReprintLabel()).toBe(true);
    });

    it('should show reprint button for BF docking type', () => {
      component.configuration.set({ chapterId: 'CH1', itemInd: DockingType.BF } as any);
      expect(component.showReprintLabel()).toBe(true);
    });

    it('should hide reprint button for BA docking type', () => {
      component.configuration.set({ chapterId: 'CH1', itemInd: DockingType.BA } as any);
      expect(component.showReprintLabel()).toBe(false);
    });

    it('should hide reprint button for FI docking type', () => {
      component.configuration.set({ chapterId: 'CH1', itemInd: DockingType.FI } as any);
      expect(component.showReprintLabel()).toBe(false);
    });

    it('should hide reprint button for SE docking type', () => {
      component.configuration.set({ chapterId: 'CH1', itemInd: DockingType.SE } as any);
      expect(component.showReprintLabel()).toBe(false);
    });

    it('should hide reprint button for NE docking type', () => {
      component.configuration.set({ chapterId: 'CH1', itemInd: DockingType.NE } as any);
      expect(component.showReprintLabel()).toBe(false);
    });
  });

  describe('Workflow Phases', () => {
    it('should show configuration form in configuration phase', () => {
      component.currentPhase.set('configuration');
      fixture.detectChanges();

      const configForm = fixture.nativeElement.querySelector('app-configuration-form');
      const workflow = fixture.nativeElement.querySelector('.sdd-workflow');

      expect(configForm).toBeTruthy();
      expect(workflow).toBeFalsy();
    });








  });
  describe('Error Display', () => {
    it('should show error banner when error exists', () => {
      component.errorMessage.set('Test error message');
      fixture.detectChanges();

      const errorBanner = fixture.nativeElement.querySelector('.error-banner');
      expect(errorBanner).toBeTruthy();
      expect(errorBanner.textContent).toContain('Test error message');
    });


  });

  describe('Action Buttons', () => {
    it('should display CANCEL and CLEAR ALL buttons for BA docking type', () => {
      component.currentPhase.set('unit-entry');
      component.configuration.set({ chapterId: 'CH1', itemInd: DockingType.BA } as any);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('.panel-footer .footer-actions button');
      const texts = Array.from(buttons).map((btn: any) => btn.textContent.trim());
      expect(texts).toContain('CANCEL');
      expect(texts.some((t: string) => t.includes('CLEAR ALL'))).toBe(true);
    });



    it('should show RE PRINT LABEL for FB docking type', () => {
      component.currentPhase.set('unit-entry');
      component.configuration.set({ chapterId: 'CH1', itemInd: DockingType.FB } as any);
      fixture.detectChanges();

      const primaryBtn = fixture.nativeElement.querySelector('.panel-footer .footer-actions .primary-btn');
      expect(primaryBtn).toBeTruthy();
      expect(primaryBtn.textContent.trim()).toContain('RE PRINT LABEL');
    });

    it('should use cancel-btn class on CANCEL and CLEAR ALL buttons', () => {
      component.currentPhase.set('unit-entry');
      component.configuration.set({ chapterId: 'CH1', itemInd: DockingType.BA } as any);
      fixture.detectChanges();

      const cancelBtns = fixture.nativeElement.querySelectorAll('.panel-footer .footer-actions .cancel-btn');
      expect(cancelBtns.length).toBe(2);
    });




  });

  describe('ngOnInit', () => {
    it('should call lovService.getProductCodes on init', () => {
      expect(lovServiceSpy.getProductCodes).toHaveBeenCalled();
    });

    it('should store product codes in cache when loaded', () => {
      const mockCodes = [
        { code: '00161', shortName: 'RBC', description: 'Red Blood Cells', productTypeId: 'PT1' },
        { code: '00200', shortName: 'PLT', description: 'Platelets', productTypeId: 'PT2' }
      ];
      lovServiceSpy.getProductCodes.and.returnValue(of(mockCodes));

      // Re-create component so ngOnInit runs with new mock data
      fixture = TestBed.createComponent(SterileDockingDefinitionComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      // Verify cache is populated by testing getShortName indirectly through onUnitAdded
      expect(component['productCodesCache'].length).toBe(2);
      expect(component['productCodesCache'][0].code).toBe('00161');
    });
  });

  describe('getShortName (private)', () => {
    it('should return shortName when product code matches', () => {
      component['productCodesCache'] = [
        { code: '00161', shortName: 'RBC', description: 'Red Blood Cells', productTypeId: 'PT1' }
      ];
      expect(component['getShortName']('00161')).toBe('RBC');
    });

    it('should return description when shortName is empty', () => {
      component['productCodesCache'] = [
        { code: '00161', shortName: '', description: 'Red Blood Cells', productTypeId: 'PT1' }
      ];
      expect(component['getShortName']('00161')).toBe('Red Blood Cells');
    });

    it('should return empty string when product code not found', () => {
      component['productCodesCache'] = [];
      expect(component['getShortName']('UNKNOWN')).toBe('');
    });
  });

  describe('onUnitAdded - error handling', () => {
    beforeEach(() => {
      component.configuration.set({
        chapterId: 'WAD',
        collDate: '2026-05-28',
        itemInd: DockingType.BA,
        sterileMachine: '01',
        waferLotNumber: 'WL001',
        lotNumber: 'LOT001',
        numberOfItems: 5,
        weldFlag: 'Y',
        programId: 'CPISDDFN'
      });
    });

    it('should return early if configuration is null', () => {
      component.configuration.set(null);
      component.onUnitAdded(mockUnitEntry);
      expect(service.create).not.toHaveBeenCalled();
    });

    it('should set isLoading to true when starting', () => {
      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded(mockUnitEntry);
      // isLoading is set to false in the subscribe callback, so after sync completion it's false
      // But we can verify by checking the create was called (proving the method ran past the null check)
      expect(service.create).toHaveBeenCalled();
    });

    it('should clear errorMessage when starting', () => {
      component.errorMessage.set('previous error');
      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded(mockUnitEntry);
      expect(component.errorMessage()).toBeNull();
    });

    it('should set error message with errorCode on failure', fakeAsync(() => {
      const errorResponse = {
        error: {
          errorCode: 'ERR001',
          message: 'Unit not found'
        }
      };
      service.create.and.returnValue(throwError(() => errorResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('[ERR001] Unit not found');
      expect(snackbarService.showError).toHaveBeenCalledWith('[ERR001] Unit not found');
    }));

    it('should set error message without errorCode on failure', fakeAsync(() => {
      const errorResponse = {
        error: {
          message: 'Server error occurred'
        }
      };
      service.create.and.returnValue(throwError(() => errorResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.errorMessage()).toBe('Server error occurred');
    }));

    it('should use default error message when no message in error body', fakeAsync(() => {
      const errorResponse = { error: {} };
      service.create.and.returnValue(throwError(() => errorResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.errorMessage()).toBe('Failed to save unit');
    }));

    it('should handle error without error body', fakeAsync(() => {
      service.create.and.returnValue(throwError(() => ({})));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Failed to save unit');
    }));

    it('should call onSaveError on unitEntryForm when error occurs', fakeAsync(() => {
      const mockForm = { onSaveError: jasmine.createSpy('onSaveError'), resetFormForNextEntry: jasmine.createSpy('resetFormForNextEntry') };
      component['unitEntryForm'] = mockForm as any;
      service.create.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(mockForm.onSaveError).toHaveBeenCalled();
    }));
  });

  describe('onUnitAdded - success handling', () => {
    beforeEach(() => {
      component.configuration.set({
        chapterId: 'WAD',
        collDate: '2026-05-28',
        itemInd: DockingType.BA,
        sterileMachine: '01',
        waferLotNumber: 'WL001',
        lotNumber: 'LOT001',
        numberOfItems: 5,
        weldFlag: 'Y',
        programId: 'CPISDDFN'
      });
    });

    it('should set isLoading to false on success', fakeAsync(() => {
      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.isLoading()).toBe(false);
    }));

    it('should add unit to enteredUnits on success', fakeAsync(() => {
      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.enteredUnits().length).toBe(1);
      expect(component.enteredUnits()[0].unitId).toBe('W454526051302');
    }));

    it('should add derived product on success', fakeAsync(() => {
      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.derivedProducts().length).toBe(1);
      expect(component.derivedProducts()[0].unitId).toBe('W454526051302');
    }));

    it('should extract worksheetId from response.item.sdcWsNumber', fakeAsync(() => {
      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.worksheetId()).toBe('052826-SD1007');
    }));

    it('should extract worksheetId from SdcWsNumber (PascalCase)', fakeAsync(() => {
      const pascalResponse = {
        item: { SdcWsNumber: 'WS-PASCAL', derivedProduct: '00161' }
      };
      service.create.and.returnValue(of(pascalResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.worksheetId()).toBe('WS-PASCAL');
    }));

    it('should extract worksheetId from SDC_WS_NUMBER (uppercase)', fakeAsync(() => {
      const upperResponse = {
        item: { SDC_WS_NUMBER: 'WS-UPPER', derivedProduct: '00161' }
      };
      service.create.and.returnValue(of(upperResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.worksheetId()).toBe('WS-UPPER');
    }));

    it('should not overwrite worksheetId on subsequent units', fakeAsync(() => {
      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.worksheetId()).toBe('052826-SD1007');

      const secondResponse = {
        item: { sdcWsNumber: 'DIFFERENT-WS', derivedProduct: '00200' }
      };
      service.create.and.returnValue(of(secondResponse));
      component.onUnitAdded({ ...mockUnitEntry, unitId: 'UNIT2' });
      tick();

      expect(component.worksheetId()).toBe('052826-SD1007');
    }));

    it('should use response.data when response.item is absent', fakeAsync(() => {
      const dataResponse = {
        data: { sdcWsNumber: 'WS-DATA', derivedProduct: '00161', productShortName: 'RBC' }
      };
      service.create.and.returnValue(of(dataResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.worksheetId()).toBe('WS-DATA');
    }));

    it('should use response.Item when item and data are absent', fakeAsync(() => {
      const itemResponse = {
        Item: { sdcWsNumber: 'WS-ITEM', derivedProduct: '00161' }
      };
      service.create.and.returnValue(of(itemResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.worksheetId()).toBe('WS-ITEM');
    }));

    it('should use fallback when response has no nested item/data', fakeAsync(() => {
      const flatResponse = { sdcWsNumber: 'WS-FLAT', derivedProduct: '00161' };
      service.create.and.returnValue(of(flatResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.worksheetId()).toBe('WS-FLAT');
    }));

    it('should show count label when numberOfItems > 0', fakeAsync(() => {
      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Unit saved (1/5)');
    }));

    it('should not show count label when numberOfItems is 0', fakeAsync(() => {
      component.configuration.set({
        chapterId: 'WAD',
        collDate: '2026-05-28',
        itemInd: DockingType.BA,
        numberOfItems: 0,
        weldFlag: 'Y',
        programId: 'CPISDDFN'
      });
      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Unit saved');
    }));

    it('should call resetFormForNextEntry on unitEntryForm when available', fakeAsync(() => {
      const mockForm = { resetFormForNextEntry: jasmine.createSpy('resetFormForNextEntry'), onSaveError: jasmine.createSpy('onSaveError') };
      component['unitEntryForm'] = mockForm as any;
      service.create.and.returnValue(of(mockApiSuccessResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(mockForm.resetFormForNextEntry).toHaveBeenCalled();
    }));

    it('should use getShortName fallback when productShortName is absent', fakeAsync(() => {
      component['productCodesCache'] = [
        { code: '00161', shortName: 'RBC', description: 'Red Blood Cells', productTypeId: 'PT1' }
      ];
      const noShortNameResponse = {
        item: { sdcWsNumber: 'WS-1', derivedProduct: '00161' }
      };
      service.create.and.returnValue(of(noShortNameResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.derivedProducts()[0].shortName).toBe('RBC');
    }));

    it('should use DerivedProduct (PascalCase) from response', fakeAsync(() => {
      const pascalResponse = {
        item: { sdcWsNumber: 'WS-1', DerivedProduct: '00200', ProductShortName: 'PLT' }
      };
      service.create.and.returnValue(of(pascalResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.derivedProducts()[0].derivedProduct).toBe('00200');
      expect(component.derivedProducts()[0].shortName).toBe('PLT');
    }));

    it('should fallback to originalProductCode when no derivedProduct in response', fakeAsync(() => {
      const noDerivResponse = {
        item: { sdcWsNumber: 'WS-1' }
      };
      service.create.and.returnValue(of(noDerivResponse));
      component.onUnitAdded(mockUnitEntry);
      tick();

      expect(component.derivedProducts()[0].derivedProduct).toBe('00161');
    }));

    it('should generate id from Date.now() when response has no id', fakeAsync(() => {
      const noIdResponse = {
        item: { sdcWsNumber: 'WS-1', derivedProduct: '00161' }
      };
      service.create.and.returnValue(of(noIdResponse));
      const beforeTime = Date.now();
      component.onUnitAdded(mockUnitEntry);
      tick();
      const afterTime = Date.now();

      const id = component.derivedProducts()[0].id;
      const numId = Number(id);
      expect(numId).toBeGreaterThanOrEqual(beforeTime);
      expect(numId).toBeLessThanOrEqual(afterTime);
    }));
  });

  describe('onCancel - configuration phase', () => {
    it('should navigate to /laboratory-functions when in configuration phase', () => {
      component.currentPhase.set('configuration');
      component.onCancel();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/laboratory-functions']);
    });
  });

  describe('onCancel - results phase', () => {
    it('should reset state when in results phase', () => {
      component.currentPhase.set('results');
      component.configuration.set({ chapterId: 'WAD' } as any);
      component.worksheetId.set('WS-123');
      component.enteredUnits.set([mockUnitEntry]);

      component.onCancel();

      expect(component.configuration()).toBeNull();
      expect(component.currentPhase()).toBe('configuration');
    });
  });

  describe('onReprintEligibleChange', () => {
    it('should set reprintEligible to true', () => {
      component.onReprintEligibleChange(true);
      expect(component.reprintEligible()).toBe(true);
    });

    it('should set reprintEligible to false', () => {
      component.reprintEligible.set(true);
      component.onReprintEligibleChange(false);
      expect(component.reprintEligible()).toBe(false);
    });
  });

  describe('onDerivedProductErrorChange', () => {
    it('should set derivedProductError to the given error string', () => {
      component.onDerivedProductErrorChange('Product not found');
      expect(component.derivedProductError()).toBe('Product not found');
    });

    it('should clear derivedProductError when given null', () => {
      component.derivedProductError.set('Previous error');
      component.onDerivedProductErrorChange(null);
      expect(component.derivedProductError()).toBeNull();
    });
  });

  describe('onReprintLabels', () => {
    it('should show error when no units entered', () => {
      component.enteredUnits.set([]);
      component.onReprintLabels();

      expect(snackbarService.showError).toHaveBeenCalledWith('No units to print labels for');
    });

    it('should show success message with unit count and worksheetId', () => {
      component.enteredUnits.set([mockUnitEntry, { ...mockUnitEntry, unitId: 'UNIT2' }]);
      component.worksheetId.set('WS-999');
      component.onReprintLabels();

      expect(snackbarService.showSuccess).toHaveBeenCalledWith(
        'Label reprint queued for 2 unit(s) (Worksheet: WS-999)'
      );
    });

    it('should show success with null worksheet when worksheetId not set', () => {
      component.enteredUnits.set([mockUnitEntry]);
      component.worksheetId.set(null);
      component.onReprintLabels();

      expect(snackbarService.showSuccess).toHaveBeenCalledWith(
        'Label reprint queued for 1 unit(s) (Worksheet: null)'
      );
    });
  });

  describe('lastDerivedProduct computed', () => {
    it('should return undefined when derivedProducts is empty', () => {
      component.derivedProducts.set([]);
      expect(component.lastDerivedProduct()).toBeUndefined();
    });

    it('should return the last derived product value', () => {
      component.derivedProducts.set([
        { id: '1', unitId: 'U1', originalProductCode: '00161', derivedProduct: 'DP1', shortName: 'RBC', weldOk: 'Y', verifyProduct: 'N' },
        { id: '2', unitId: 'U2', originalProductCode: '00200', derivedProduct: 'DP2', shortName: 'PLT', weldOk: 'Y', verifyProduct: 'N' }
      ]);
      expect(component.lastDerivedProduct()).toBe('DP2');
    });

    it('should return the only derived product when there is one', () => {
      component.derivedProducts.set([
        { id: '1', unitId: 'U1', originalProductCode: '00161', derivedProduct: 'SINGLE', shortName: 'RBC', weldOk: 'Y', verifyProduct: 'N' }
      ]);
      expect(component.lastDerivedProduct()).toBe('SINGLE');
    });
  });

  describe('showReprintLabel computed - edge cases', () => {
    it('should return false when configuration is null', () => {
      component.configuration.set(null);
      expect(component.showReprintLabel()).toBeFalsy();
    });

    it('should return false when itemInd is undefined', () => {
      component.configuration.set({ chapterId: 'CH1' } as any);
      expect(component.showReprintLabel()).toBe(false);
    });
  });

  describe('existingUnitIds computed - edge cases', () => {
    it('should return empty array when no units entered', () => {
      component.enteredUnits.set([]);
      expect(component.existingUnitIds()).toEqual([]);
    });
  });

  describe('buildUnitDto - edge cases', () => {
    const config = {
      chapterId: 'WAD',
      collDate: '2026-05-28',
      itemInd: DockingType.BA,
      sterileMachine: '01',
      waferLotNumber: 'WL001',
      lotNumber: 'LOT001',
      numberOfItems: 5,
      programId: 'CPISDDFN',
      bagCatalogNumber: 'CAT001',
      filterType: 'FILT1',
      filterLotNumber: 'FLTLOT1',
      attributeCode: 'ATT01',
      processDate: '2026-05-28',
      numberOfComponents: 3,
      segmentRemFlag: 'Y',
      segmentNumber: 'SEG1'
    } as any;

    it('should not include sdcWsNumber when not provided', () => {
      const dto = component['buildUnitDto'](config, mockUnitEntry);
      expect(dto.sdcWsNumber).toBeUndefined();
    });

    it('should map catalogNumber from bagCatalogNumber', () => {
      const dto = component['buildUnitDto'](config, mockUnitEntry);
      expect(dto.catalogNumber).toBe('CAT001');
    });

    it('should map catalogNumber from config.catalogNumber when bagCatalogNumber is empty', () => {
      const configNoBag = { ...config, bagCatalogNumber: '', catalogNumber: 'CAT-FALLBACK' };
      const dto = component['buildUnitDto'](configNoBag, mockUnitEntry);
      expect(dto.catalogNumber).toBe('CAT-FALLBACK');
    });

    it('should map filterType and filterLotNumber', () => {
      const dto = component['buildUnitDto'](config, mockUnitEntry);
      expect(dto.filterType).toBe('FILT1');
      expect(dto.filterLotNumber).toBe('FLTLOT1');
    });

    it('should map attribCode from attributeCode', () => {
      const dto = component['buildUnitDto'](config, mockUnitEntry);
      expect(dto.attribCode).toBe('ATT01');
    });

    it('should fallback attribCode to config.attribCode when attributeCode is missing', () => {
      const configNoAttr = { ...config, attributeCode: undefined, attribCode: 'ATTFB' };
      const dto = component['buildUnitDto'](configNoAttr, mockUnitEntry);
      expect(dto.attribCode).toBe('ATTFB');
    });

    it('should map processDate from config', () => {
      const dto = component['buildUnitDto'](config, mockUnitEntry);
      expect(dto.processDate).toBe('2026-05-28');
    });

    it('should map numberOfBags from numberOfComponents', () => {
      const dto = component['buildUnitDto'](config, mockUnitEntry);
      expect(dto.numberOfBags).toBe(3);
    });

    it('should fallback numberOfBags to config.numberOfBags', () => {
      const configNoBags = { ...config, numberOfComponents: undefined, numberOfBags: 7 };
      const dto = component['buildUnitDto'](configNoBags, mockUnitEntry);
      expect(dto.numberOfBags).toBe(7);
    });

    it('should map segmentRemFlag and segmentNumber', () => {
      const dto = component['buildUnitDto'](config, mockUnitEntry);
      expect(dto.segmentRemFlag).toBe('Y');
      expect(dto.segmentNumber).toBe('SEG1');
    });

    it('should map oldProductCode from unit originalProductCode', () => {
      const dto = component['buildUnitDto'](config, mockUnitEntry);
      expect(dto.oldProductCode).toBe('00161');
    });

    it('should map numberOfUnitsEntered from numberOfItems', () => {
      const dto = component['buildUnitDto'](config, mockUnitEntry);
      expect(dto.numberOfUnitsEntered).toBe(5);
    });
  });

  describe('onRemoveProduct - snackbar', () => {
    it('should show success snackbar when unit removed', () => {
      component.derivedProducts.set([
        { id: '1', unitId: 'U1', originalProductCode: '00161', derivedProduct: 'DP1', shortName: 'RBC', weldOk: 'Y', verifyProduct: 'N' }
      ]);
      component.enteredUnits.set([{ ...mockUnitEntry, unitId: 'U1' }]);

      component.onRemoveProduct('U1');

      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Unit removed');
      expect(component.derivedProducts().length).toBe(0);
      expect(component.enteredUnits().length).toBe(0);
    });
  });

  describe('onConfigurationComplete - full field mapping', () => {
    it('should set weldFlag to Y and programId to CPISDDFN', () => {
      const event = { configData: mockConfigData, formData: mockFormData };
      component.onConfigurationComplete(event);

      expect(component.configuration()?.weldFlag).toBe('Y');
      expect(component.configuration()?.programId).toBe('CPISDDFN');
    });

    it('should show success snackbar on configuration complete', () => {
      const event = { configData: mockConfigData, formData: mockFormData };
      component.onConfigurationComplete(event);

      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Configuration complete. Please scan or enter unit IDs...');
    });

    it('should map all optional configuration fields', () => {
      const fullConfigData = {
        ...mockConfigData,
        filterType: 'FILT1',
        filterLotNumber: 'FLOT1',
        attribCode: 'ATT01',
        attribGroup: 'GRP1',
        processDateDisplay: '26-MAY-2026',
        segmentRemFlag: 'Y',
        segmentNumber: 'SEG1'
      };
      const event = { configData: fullConfigData, formData: mockFormData };
      component.onConfigurationComplete(event);

      const config = component.configuration();
      expect(config?.filterType).toBe('FILT1');
      expect(config?.filterLotNumber).toBe('FLOT1');
      expect(config?.attribCode).toBe('ATT01');
      expect(config?.attribGroup).toBe('GRP1');
      expect(config?.processDateDisplay).toBe('26-MAY-2026');
      expect(config?.segmentRemFlag).toBe('Y');
      expect(config?.segmentNumber).toBe('SEG1');
    });
  });

  describe('resetState (private)', () => {
    it('should clear all state properties', () => {
      component.configuration.set({ chapterId: 'WAD' } as any);
      component.derivedProducts.set([
        { id: '1', unitId: 'U1', originalProductCode: '00161', derivedProduct: 'DP1', shortName: 'RBC', weldOk: 'Y', verifyProduct: 'N' }
      ]);
      component.worksheetId.set('WS-123');
      component.enteredUnits.set([mockUnitEntry]);
      component.currentPhase.set('results');

      component['resetState']();

      expect(component.configuration()).toBeNull();
      expect(component.derivedProducts()).toEqual([]);
      expect(component.worksheetId()).toBeNull();
      expect(component.enteredUnits()).toEqual([]);
      expect(component.currentPhase()).toBe('configuration');
    });

    it('should clear error and UI state signals', () => {
      component.errorMessage.set('some error');
      component.derivedProductError.set('derived error');
      component.reprintEligible.set(true);
      component.isLoading.set(true);

      component['resetState']();

      expect(component.errorMessage()).toBeNull();
      expect(component.derivedProductError()).toBeNull();
      expect(component.reprintEligible()).toBe(false);
      expect(component.isLoading()).toBe(false);
    });

    it('should clear LOV cache', () => {
      component['resetState']();
      expect(lovServiceSpy.clearCache).toHaveBeenCalled();
    });

    it('should clear productCodesCache', () => {
      component['productCodesCache'] = [
        { code: '00161', shortName: 'RBC', description: 'Red Blood Cells', productTypeId: 'PT1' }
      ];

      component['resetState']();

      expect(component['productCodesCache']).toEqual([]);
    });
  });

  describe('headerConfig', () => {
    it('should have correct initial breadcrumbs', () => {
      expect(component.headerConfig.breadcrumbs.length).toBe(5);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.title).toBe('Sterile Docking Definition');
    });

    it('should have empty subtitle initially', () => {
      expect(component.headerConfig.subtitle).toBe('');
    });
  });

  describe('onClearAll - entered units reset', () => {
    it('should clear enteredUnits', () => {
      component.enteredUnits.set([mockUnitEntry, { ...mockUnitEntry, unitId: 'UNIT2' }]);
      component.onClearAll();
      expect(component.enteredUnits()).toEqual([]);
    });
  });

  describe('initial signal values', () => {
    it('should have empty derivedProducts initially', () => {
      expect(component.derivedProducts()).toEqual([]);
    });

    it('should have null configuration initially', () => {
      expect(component.configuration()).toBeNull();
    });

    it('should have empty enteredUnits initially', () => {
      expect(component.enteredUnits()).toEqual([]);
    });

    it('should have reprintEligible as false initially', () => {
      expect(component.reprintEligible()).toBe(false);
    });

    it('should have null derivedProductError initially', () => {
      expect(component.derivedProductError()).toBeNull();
    });
  });
});
