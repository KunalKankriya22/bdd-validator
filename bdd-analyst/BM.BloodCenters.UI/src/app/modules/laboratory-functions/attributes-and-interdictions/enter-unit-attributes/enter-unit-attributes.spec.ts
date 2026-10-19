import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EnterUnitAttributesComponent } from './enter-unit-attributes';
import { UnitAttributeApiService } from './services/unit-attribute-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockActivatedRoute, createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  UnitValidationResult,
  UnitAttributeRow,
  AttributeGroupOption,
  AttributeCodeOption,
} from './models/unit-attribute.model';

describe('EnterUnitAttributesComponent', () => {
  let pageHeaderSpy: any;
  let apiSpy: any;
  let component: EnterUnitAttributesComponent;
  let fixture: ComponentFixture<EnterUnitAttributesComponent>;
  let apiService: jasmine.SpyObj<UnitAttributeApiService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockValidation: UnitValidationResult = {
    unitId: 'W123456789012',
    collDate: '2024-01-15T00:00:00',
    chapterId: 'HQ01',
    contractId: 'INTERNAL',
    contractName: 'Internal Blood Collection',
    hasCueCompleted: true,
    hasLabeledComponents: false,
    alertSpFlag: 'Y',
  };

  const mockAttributes: UnitAttributeRow[] = [
    {
      attribGroup: 'ALERT',
      attribGroupDesc: 'Alert Codes',
      attribCode: 'HBSA',
      attribCodeDesc: 'HBsAg Reactive',
      statusFlag: 'Q',
      stopLabelFlag: 'Y',
      insertDate: '2024-01-15T00:00:00',
      insertUserId: 'USER01',
    },
  ];

  const mockGroups: AttributeGroupOption[] = [
    { code: 'ALERT', description: 'Alert Codes' },
    { code: 'SP', description: 'Special Handling' },
  ];

  const mockCodes: AttributeCodeOption[] = [
    { code: 'HBSA', description: 'HBsAg Reactive' },
    { code: 'HCVR', description: 'HCV Reactive' },
  ];

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj('UnitAttributeApiService', [
      'validateUnit',
      'getAttributes',
      'getAttributeGroups',
      'getAttributeCodes',
      'createAttribute',
      'deleteAttribute',
    ]);
    const snackbarSpy = createMockSnackbarService();
    pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', ['getCurrentMenuItem'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(undefined),
    });
    const headerSpy = createMockHeaderService();



      TestBed.configureTestingModule({
      imports: [
        EnterUnitAttributesComponent,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
        provideNativeDateAdapter(),
      ],
    })
    .overrideComponent(EnterUnitAttributesComponent, {
      set: {
        providers: [
          { provide: UnitAttributeApiService, useValue: apiSpy },
        ],
      },
    });


    


      apiSpy.validateUnit.calls.reset();


      apiSpy.getAttributes.calls.reset();


      apiSpy.getAttributeGroups.calls.reset();


      apiSpy.getAttributeCodes.calls.reset();


      apiSpy.createAttribute.calls.reset();


      apiSpy.deleteAttribute.calls.reset();


      pageHeaderSpy.getCurrentMenuItem.calls.reset();


    fixture = TestBed.createComponent(EnterUnitAttributesComponent);
    component = fixture.componentInstance;
    apiService = fixture.debugElement.injector.get(UnitAttributeApiService) as jasmine.SpyObj<UnitAttributeApiService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;


    });


  describe('Initial State', () => {


    it('should not be in edit mode initially', () => {
      expect(component.isEditMode()).toBeFalse();
    });

    it('should not be loading initially', () => {
      expect(component.isLoading()).toBeFalse();
    });

    it('should have null unit validation initially', () => {
      expect(component.unitValidation()).toBeNull();
    });

    it('should display "-" for collection date when no unit validated', () => {
      expect(component.collectionDateDisplay).toBe('-');
    });
  });

  describe('Unit Validation', () => {
    it('should validate unit and load attributes on unit validated', fakeAsync(() => {
      apiService.validateUnit.and.returnValue(of(mockValidation));
      apiService.getAttributes.and.returnValue(of({ data: mockAttributes, totalRecords: 1 }));

      component.onUnitValidated({
        parsedUnitId: 'W123456789012',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'W123456789012',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
      });
      tick();

      expect(apiService.validateUnit).toHaveBeenCalledWith('W123456789012');
      expect(component.unitValidation()).toEqual(mockValidation);
      expect(component.dataSource()).toEqual(mockAttributes);
    }));

    it('should reset state on unit cleared', () => {
      component.unitValidation.set(mockValidation);
      component.dataSource.set(mockAttributes);

      component.onUnitCleared();

      expect(component.unitValidation()).toBeNull();
      expect(component.dataSource()).toEqual([]);
      expect(component.isEditMode()).toBeFalse();
    });

    it('should format collection date as DD-MMM-YYYY', () => {
      component.unitValidation.set(mockValidation);
      expect(component.collectionDateDisplay).toBe('15-JAN-2024');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.unitValidation.set(mockValidation);
      component.dataSource.set(mockAttributes);
      component.attributesArray.clear();
      mockAttributes.forEach(() => {
        component.attributesArray.push(component['createRowFormGroup'](mockAttributes[0], false));
      });
    });

    it('should enter edit mode and load attribute groups', fakeAsync(() => {
      apiService.getAttributeGroups.and.returnValue(of(mockGroups));

      component.onToggleEdit();
      tick();

      expect(component.isEditMode()).toBeTrue();
      expect(component.attributeGroups()).toEqual(mockGroups);
      expect(apiService.getAttributeGroups).toHaveBeenCalled();
    }));

    it('should add a new empty row at the top when entering edit mode', fakeAsync(() => {
      apiService.getAttributeGroups.and.returnValue(of(mockGroups));
      const initialLength = component.attributesArray.length;

      component.onToggleEdit();
      tick();

      expect(component.attributesArray.length).toBe(initialLength + 1);
      expect(component.attributesArray.at(0).get('isNew')?.value).toBeTrue();
    }));

    it('should add new row on ADD NEW ROW click', () => {
      component.isEditMode.set(true);
      const initialLength = component.attributesArray.length;

      component.onAddAttribute();

      expect(component.attributesArray.length).toBe(initialLength + 1);
      expect(component.attributesArray.at(0).get('isNew')?.value).toBeTrue();
      expect(component.attributesArray.at(0).get('attribGroup')?.value).toBe('');
    });

    it('should exit edit mode and reload data on cancel', fakeAsync(() => {
      apiService.getAttributes.and.returnValue(of({ data: mockAttributes, totalRecords: 1 }));
      component.isEditMode.set(true);

      component.onCancelEdit();
      tick();

      expect(component.isEditMode()).toBeFalse();
      expect(apiService.getAttributes).toHaveBeenCalled();
    }));



    it('should delete existing row and reload data', fakeAsync(() => {
      component.isEditMode.set(true);
      apiService.deleteAttribute.and.returnValue(of({}));
      apiService.getAttributes.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.onDeleteAttribute(0);
      tick();

      expect(apiService.deleteAttribute).toHaveBeenCalledWith(
        mockValidation.unitId,
        mockAttributes[0].attribGroup,
        mockAttributes[0].attribCode,
        mockValidation.collDate
      );
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Attribute deleted successfully');
      expect(apiService.getAttributes).toHaveBeenCalled();
    }));


  });

  describe('Dropdown Handling', () => {


    it('should update code description when code changes', () => {
      const row = component['createRowFormGroup'](null, true);
      component.attributesArray.push(row);
      component['rowCodesMap'].set(row, mockCodes);
      row.get('attribCode')?.setValue('HBSA');

      component.onCodeChange(row);

      expect(row.get('attribCodeDesc')?.value).toBe('HBsAg Reactive');
    });
  });

  describe('Save', () => {
    beforeEach(() => {
      component.unitValidation.set(mockValidation);
      component.isEditMode.set(true);
      component.currentCodeScheme = 'I';
    });



    it('should save new rows and switch to view mode', fakeAsync(() => {
      const newRow = component['createRowFormGroup'](
        { attribGroup: 'ALERT', attribGroupDesc: 'Alert Codes', attribCode: 'HBSA', attribCodeDesc: 'HBsAg Reactive' } as UnitAttributeRow,
        true
      );
      component.attributesArray.push(newRow);

      apiService.createAttribute.and.returnValue(of({}));
      apiService.getAttributes.and.returnValue(of({ data: mockAttributes, totalRecords: 1 }));

      component.onSaveAll();
      tick();

      expect(apiService.createAttribute).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Record saved successfully');
      expect(component.isEditMode()).toBeFalse();
      expect(component.unitValidation()).toEqual(mockValidation);
    }));

    it('should switch to view mode and reload when no new rows exist', fakeAsync(() => {
      apiService.getAttributes.and.returnValue(of({ data: mockAttributes, totalRecords: 1 }));

      component.onSaveAll();
      tick();

      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Record saved successfully');
      expect(component.isEditMode()).toBeFalse();
      expect(component.unitValidation()).toEqual(mockValidation);
    }));
  });

  describe('Commit Session', () => {
    it('should clear form without success message', () => {
      component.unitValidation.set(mockValidation);

      component.onCommitSession();

      expect(snackbarService.showSuccess).not.toHaveBeenCalled();
      expect(component.unitValidation()).toBeNull();
      expect(component.dataSource()).toEqual([]);
    });
  });
  describe('hasFormData', () => {
    it('should return false when no data', () => {
      expect(component.hasFormData).toBeFalse();
    });

    it('should return true when unit is validated', () => {
      component.unitValidation.set(mockValidation);
      expect(component.hasFormData).toBeTrue();
    });
  });
});
