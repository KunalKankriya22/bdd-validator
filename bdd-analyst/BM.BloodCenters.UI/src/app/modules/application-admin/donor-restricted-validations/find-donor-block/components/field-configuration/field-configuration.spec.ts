import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { FieldConfigurationComponent } from './field-configuration';
import { FindDonorBlockService } from '../../services/find-donor-block.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { FieldConfigurationEntry } from '../../models/find-donor-block.model';
import { createMockMatSnackBar, createMockPageHeaderService } from '@shared/testing/common-mocks';

describe('FieldConfigurationComponent', () => {
  let pageHeaderServiceSpy: any;
  let routerSpy: any;
  let serviceSpy: any;
  let component: FieldConfigurationComponent;
  let fixture: ComponentFixture<FieldConfigurationComponent>;
  let findDonorBlockService: jasmine.SpyObj<FindDonorBlockService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockFields: FieldConfigurationEntry[] = [
    {
      fieldName: 'FIRST_NAME',
      required: true,
      numberOfEntries: 1,
      functionCheck: false,
      protectedEntry: false
    },
    {
      fieldName: 'LAST_NAME',
      required: true,
      numberOfEntries: 1,
      functionCheck: true,
      protectedEntry: false
    },
    {
      fieldName: 'GENDER',
      required: false,
      numberOfEntries: 1,
      functionCheck: false,
      protectedEntry: true
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('FindDonorBlockService', [
      'getFieldConfigurations',
      'addFieldConfiguration',
      'updateFieldConfigurations',
      'deleteFieldConfiguration',
      'mapFieldConfigToDto'
    ]);

    const snackBarSpy = createMockMatSnackBar();
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of({})
    });
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('/mock-url');
    const activatedRouteSpy = {
      params: of({ programName: 'TEST_PROGRAM' }),
      snapshot: { params: { programName: 'TEST_PROGRAM' } }
    };
    pageHeaderServiceSpy = createMockPageHeaderService();
    pageHeaderServiceSpy.getSubtitle.and.returnValue('Test Subtitle');
    pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue({ remarks: 'Test Remarks' });



      TestBed.configureTestingModule({
      imports: [
        FieldConfigurationComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        { provide: FindDonorBlockService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy }
      ]
    });


    


      serviceSpy.getFieldConfigurations.calls.reset();


      serviceSpy.addFieldConfiguration.calls.reset();


      serviceSpy.updateFieldConfigurations.calls.reset();


      serviceSpy.deleteFieldConfiguration.calls.reset();


      serviceSpy.mapFieldConfigToDto.calls.reset();


      routerSpy.navigate.calls.reset();


      routerSpy.createUrlTree.calls.reset();


      routerSpy.serializeUrl.calls.reset();


      routerSpy.createUrlTree.and.returnValue({} as any);


      routerSpy.serializeUrl.and.returnValue('/mock-url');


      pageHeaderServiceSpy.getSubtitle.and.returnValue('Test Subtitle');


      pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue({ remarks: 'Test Remarks' });


    findDonorBlockService = TestBed.inject(FindDonorBlockService) as jasmine.SpyObj<FindDonorBlockService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;


    
    fixture = TestBed.createComponent(FieldConfigurationComponent);
    component = fixture.componentInstance;
  });


  describe('Initialization', () => {
    it('should load field configurations on init', () => {
      findDonorBlockService.getFieldConfigurations.and.returnValue(of(mockFields));

      fixture.detectChanges();

      expect(findDonorBlockService.getFieldConfigurations).toHaveBeenCalledWith('TEST_PROGRAM');
      expect(component.dataSource.length).toBe(3);
      expect(component.filteredData.length).toBe(3);
    });
  });

  describe('Field Management', () => {
    beforeEach(() => {
      findDonorBlockService.getFieldConfigurations.and.returnValue(of(mockFields));
      fixture.detectChanges();
    });



    it('should add new field row', () => {
      const initialLength = component.dataSource.length;

      component.addNewField();

      expect(component.dataSource.length).toBe(initialLength + 1);
      expect(component.dataSource[0].isNewRow).toBe(true);
      expect(component.isEditModeActive).toBe(true);
    });



    it('should update modified existing fields via PUT', () => {
      findDonorBlockService.mapFieldConfigToDto.and.callFake((row: any) => ({
        fieldName: row.fieldName,
        required: row.required ? 'Y' : 'N',
        noOfEntries: row.numberOfEntries,
        functionCheck: row.functionCheck ? 'Y' : 'N',
        protectedEntry: row.protectedEntry ? 'Y' : 'N'
      }));
      findDonorBlockService.updateFieldConfigurations.and.returnValue(
        of({ message: '1 field(s) updated successfully.', programName: 'TEST_PROGRAM', updatedCount: 1 })
      );
      findDonorBlockService.getFieldConfigurations.and.returnValue(of(mockFields));

      component.enableEditMode();
      // Modify an existing row
      component.dataSource[0].required = false;

      component.saveAll();

      expect(findDonorBlockService.updateFieldConfigurations).toHaveBeenCalledWith(
        'TEST_PROGRAM',
        [jasmine.objectContaining({ fieldName: 'FIRST_NAME', required: 'N' })]
      );
    });

    it('should not call update API when no existing rows are modified', () => {
      findDonorBlockService.getFieldConfigurations.and.returnValue(of(mockFields));

      component.enableEditMode();
      // Don't modify anything
      component.saveAll();

      expect(findDonorBlockService.updateFieldConfigurations).not.toHaveBeenCalled();
    });



    it('should delete a new row without API call', () => {
      component.addNewField();
      const initialLength = component.dataSource.length;
      const newRow = component.dataSource[0];

      component.deleteRow(newRow);

      expect(component.dataSource.length).toBe(initialLength - 1);
      expect(findDonorBlockService.deleteFieldConfiguration).not.toHaveBeenCalled();
    });

    it('should delete an existing row via API', () => {
      findDonorBlockService.deleteFieldConfiguration.and.returnValue(
        of({ message: 'Field deleted successfully.' })
      );
      const initialLength = component.dataSource.length;
      const rowToDelete = component.dataSource[0];

      component.deleteRow(rowToDelete);

      expect(findDonorBlockService.deleteFieldConfiguration).toHaveBeenCalledWith('TEST_PROGRAM', 'FIRST_NAME');
      expect(component.dataSource.length).toBe(initialLength - 1);
    });
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      findDonorBlockService.getFieldConfigurations.and.returnValue(of(mockFields));
      fixture.detectChanges();
    });



    it('should show all fields when search term is empty', () => {
      component.onSearch('');

      expect(component.filteredData.length).toBe(mockFields.length);
    });


  });

  describe('Sorting', () => {
    beforeEach(() => {
      findDonorBlockService.getFieldConfigurations.and.returnValue(of(mockFields));
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

  describe('Error Handling', () => {
    beforeEach(() => {
      findDonorBlockService.getFieldConfigurations.and.returnValue(of(mockFields));
      fixture.detectChanges();
    });

    it('should show validation error when fields are invalid', () => {
      component.addNewField();
      component.dataSource[0].fieldName = '';

      component.saveAll();

      expect(component.showValidationError).toBe(true);
    });
  });
});
