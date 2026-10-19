import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { TranslateModule } from '@ngx-translate/core';
import { LocationSelectionDialog, LocationSelectionDialogData } from './location-selection-dialog';
import { ReleaseProductQuarantineApiService } from '../../services/release-product-quarantine-api.service';
import { StorageLocation } from '../../models/release-product-quarantine.model';

describe('LocationSelectionDialog', () => {
  let component: any;
  let fixture: ComponentFixture<LocationSelectionDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<LocationSelectionDialog>>;
  let apiServiceSpy: jasmine.SpyObj<ReleaseProductQuarantineApiService>;

  const mockLocations: StorageLocation[] = [
    {
      warehouseId: 'W01',
      deviceType: 'FR',
      deviceNumber: 'D01',
      rackNumber: 'R01',
      shelfNumber: '01',
      trayId: 'T01',
      locationId: 'W01-D01-R01-T01',
      warehouseDesc: 'Main Warehouse',
      deviceDesc: 'Freezer 1',
      trayDesc: 'Tray 1',
      trayCapacity: 24,
      currentCount: 10,
      productType: 'RBC',
      bloodType: 'O',
      storageClass: 'A',
      mixAbo: 'N',
      mixProduct: 'N'
    },
    {
      warehouseId: 'W01',
      deviceType: 'FR',
      deviceNumber: 'D02',
      rackNumber: 'R01',
      shelfNumber: '01',
      trayId: 'T02',
      locationId: 'W01-D02-R01-T02',
      warehouseDesc: 'Main Warehouse',
      deviceDesc: 'Freezer 2',
      trayDesc: 'Tray 2',
      trayCapacity: 24,
      currentCount: 24,
      productType: 'RBC',
      bloodType: 'O',
      storageClass: 'A',
      mixAbo: 'N',
      mixProduct: 'N'
    }
  ];

  const mockDialogData: LocationSelectionDialogData = {
    warehouseId: 'W01',
    productType: 'RBC',
    bloodType: 'O'
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('ReleaseProductQuarantineApiService', ['getStorageLocations']);

    apiServiceSpy.getStorageLocations.and.returnValue(of(mockLocations));



      TestBed.configureTestingModule({
      imports: [LocationSelectionDialog, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: ReleaseProductQuarantineApiService, useValue: apiServiceSpy }
      ]
    });


    


      dialogRefSpy.close.calls.reset();


      apiServiceSpy.getStorageLocations.calls.reset();


      apiServiceSpy.getStorageLocations.and.returnValue(of(mockLocations));


    fixture = TestBed.createComponent(LocationSelectionDialog);
    component = fixture.componentInstance;


    });


  it('should load locations on init', (done) => {
    fixture.detectChanges();

    setTimeout(() => {
      expect(apiServiceSpy.getStorageLocations).toHaveBeenCalledWith(
        'W01',
        'RBC',
        'O'
      );
      expect(component.locations().length).toBe(2);
      expect(component.dataSource.data.length).toBe(2);
      expect(component.loading()).toBeFalse();
      done();
    }, 100);
  });

  it('should handle error loading locations', (done) => {
    apiServiceSpy.getStorageLocations.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    fixture.detectChanges();

    setTimeout(() => {
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeTruthy();
      done();
    }, 100);
  });



  it('should detect if has locations', () => {
    component.locations.set(mockLocations);
    expect(component.hasLocations).toBeTrue();

    component.locations.set([]);
    expect(component.hasLocations).toBeFalse();
  });

  it('should select location', () => {
    component.onSelectLocation(mockLocations[0]);
    expect(component.selectedLocation()).toEqual(mockLocations[0]);
  });

  it('should detect selected location', () => {
    component.selectedLocation.set(mockLocations[0]);
    expect(component.isSelected(mockLocations[0])).toBeTrue();
    expect(component.isSelected(mockLocations[1])).toBeFalse();
  });

  it('should detect if location is full', () => {
    expect(component.isLocationFull(mockLocations[0])).toBeFalse();
    expect(component.isLocationFull(mockLocations[1])).toBeTrue();
  });



  it('should return capacity class based on percentage', () => {
    const lowCapacity: StorageLocation = { ...mockLocations[0], currentCount: 5, trayCapacity: 24 };
    const mediumCapacity: StorageLocation = { ...mockLocations[0], currentCount: 15, trayCapacity: 24 };
    const highCapacity: StorageLocation = { ...mockLocations[0], currentCount: 20, trayCapacity: 24 };
    const fullCapacity: StorageLocation = { ...mockLocations[0], currentCount: 24, trayCapacity: 24 };

    expect(component.getCapacityClass(lowCapacity)).toBe('capacity-low');
    expect(component.getCapacityClass(mediumCapacity)).toBe('capacity-medium');
    expect(component.getCapacityClass(highCapacity)).toBe('capacity-high');
    expect(component.getCapacityClass(fullCapacity)).toBe('capacity-full');
  });





  it('should confirm selection if valid', () => {
    component.selectedLocation.set(mockLocations[0]);
    component.onConfirm();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(mockLocations[0]);
  });

  it('should cancel and close dialog', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });







  it('should display correct table columns', () => {
    expect(component.displayedColumns).toEqual([
      'locationId',
      'warehouseDesc',
      'deviceDesc',
      'trayDesc',
      'capacity',
      'bloodType',
      'productType',
      'actions'
    ]);
  });
});
