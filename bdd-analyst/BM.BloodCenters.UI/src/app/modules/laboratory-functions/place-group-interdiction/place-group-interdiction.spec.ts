import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

import { PlaceGroupInterdiction } from './place-group-interdiction';
import { GroupInterdictionApiService } from './services/group-interdiction-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ValidInterdictionDto,
  DriveDto,
  BatchDto,
  CollectionDateDto,
  LotNumberDto,
  InterdictionDto,
} from './models/group-interdiction.model';

describe('PlaceGroupInterdiction', () => {
  let component: PlaceGroupInterdiction;
  let fixture: ComponentFixture<PlaceGroupInterdiction>;
  let apiServiceSpy: jasmine.SpyObj<GroupInterdictionApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialog: MatDialog;

  const mockActiveInterdictions: ValidInterdictionDto[] = [
    { interCode: 'CODE1', interDesc: 'Test Interdiction 1', interType: 'NFT' },
    { interCode: 'CODE2', interDesc: 'Test Interdiction 2', interType: 'HOLD' },
  ];

  const mockDrives: DriveDto[] = [
    { driveId: 'DRIVE1' },
    { driveId: 'DRIVE2' },
  ];

  const mockBatches: BatchDto[] = [
    { batchId: 'BATCH001' },
    { batchId: 'BATCH002' },
  ];

  const mockCollectionDates: CollectionDateDto[] = [
    { collDate: '2024-05-26T00:00:00Z', formattedDate: '26-MAY-2024' },
    { collDate: '2024-05-25T00:00:00Z', formattedDate: '25-MAY-2024' },
  ];

  const mockLotNumbers: LotNumberDto[] = [
    { lotNumber: 'LOT123' },
    { lotNumber: 'LOT456' },
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('GroupInterdictionApiService', [
      'getActiveInterdictions',
      'getDrives',
      'getBatches',
      'getCollectionDates',
      'getLotNumbers',
      'previewAffectedUnits',
      'placeInterdictions',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    apiServiceSpy.getActiveInterdictions.and.returnValue(of(mockActiveInterdictions));
    apiServiceSpy.getDrives.and.returnValue(of(mockDrives));
    apiServiceSpy.getBatches.and.returnValue(of(mockBatches));
    apiServiceSpy.getCollectionDates.and.returnValue(of(mockCollectionDates));
    apiServiceSpy.getLotNumbers.and.returnValue(of(mockLotNumbers));



      TestBed.configureTestingModule({
      imports: [PlaceGroupInterdiction, NoopAnimationsModule],
      providers: [
        { provide: GroupInterdictionApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        Overlay,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });


    


      apiServiceSpy.getActiveInterdictions.calls.reset();


      apiServiceSpy.getDrives.calls.reset();


      apiServiceSpy.getBatches.calls.reset();


      apiServiceSpy.getCollectionDates.calls.reset();


      apiServiceSpy.getLotNumbers.calls.reset();


      apiServiceSpy.previewAffectedUnits.calls.reset();


      apiServiceSpy.placeInterdictions.calls.reset();


      apiServiceSpy.getActiveInterdictions.and.returnValue(of(mockActiveInterdictions));


      apiServiceSpy.getDrives.and.returnValue(of(mockDrives));


      apiServiceSpy.getBatches.and.returnValue(of(mockBatches));


      apiServiceSpy.getCollectionDates.and.returnValue(of(mockCollectionDates));


      apiServiceSpy.getLotNumbers.and.returnValue(of(mockLotNumbers));


    fixture = TestBed.createComponent(PlaceGroupInterdiction);
    component = fixture.componentInstance;
    dialog = (component as any).dialog;
    spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as MatDialogRef<any>);


    });
  describe('Mode Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should load drives when DRIVE mode is selected', fakeAsync(() => {
      component.form.get('mode')?.setValue('DRIVE');
      tick();

      expect(apiServiceSpy.getDrives).toHaveBeenCalled();
      expect((component as any).driveOptions()).toEqual(mockDrives);
    }));

    it('should load batches when BATCH mode is selected', fakeAsync(() => {
      component.form.get('mode')?.setValue('BATCH');
      tick();

      expect(apiServiceSpy.getBatches).toHaveBeenCalled();
      expect((component as any).batchOptions()).toEqual(mockBatches);
    }));

    it('should load collection dates when COLL DATE mode is selected', fakeAsync(() => {
      component.form.get('mode')?.setValue('COLL DATE');
      tick();

      expect(apiServiceSpy.getCollectionDates).toHaveBeenCalled();
      expect((component as any).collectionDateOptions()).toEqual(mockCollectionDates);
    }));

    it('should load lot numbers when LOT mode is selected', fakeAsync(() => {
      component.form.get('mode')?.setValue('LOT');
      tick();

      expect(apiServiceSpy.getLotNumbers).toHaveBeenCalled();
      expect((component as any).lotNumberOptions()).toEqual(mockLotNumbers);
    }));



    it('should update value field type based on mode', () => {
      component.form.get('mode')?.setValue('DRIVE');
      expect((component as any).valueFieldType()).toBe('dropdown');

      component.form.get('mode')?.setValue('COLL DATE');
      expect((component as any).valueFieldType()).toBe('dropdown');

      component.form.get('mode')?.setValue('TBID');
      expect((component as any).valueFieldType()).toBe('text');
    });
  });

  describe('Dropdown Sort Order (Descending)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should sort drive options in descending order', fakeAsync(() => {
      const unsortedDrives: DriveDto[] = [
        { driveId: 'DRIVE-A' },
        { driveId: 'DRIVE-Z' },
        { driveId: 'DRIVE-M' },
      ];
      apiServiceSpy.getDrives.and.returnValue(of(unsortedDrives));

      component.form.get('mode')?.setValue('DRIVE');
      tick();

      const filteredOptions = (component as any).filteredDriveOptions();
      expect(filteredOptions[0].driveId).toBe('DRIVE-Z');
      expect(filteredOptions[1].driveId).toBe('DRIVE-M');
      expect(filteredOptions[2].driveId).toBe('DRIVE-A');
    }));

    it('should sort batch options in descending order', fakeAsync(() => {
      const unsortedBatches: BatchDto[] = [
        { batchId: 'BATCH001' },
        { batchId: 'BATCH999' },
        { batchId: 'BATCH500' },
      ];
      apiServiceSpy.getBatches.and.returnValue(of(unsortedBatches));

      component.form.get('mode')?.setValue('BATCH');
      tick();

      const filteredOptions = (component as any).filteredBatchOptions();
      expect(filteredOptions[0].batchId).toBe('BATCH999');
      expect(filteredOptions[1].batchId).toBe('BATCH500');
      expect(filteredOptions[2].batchId).toBe('BATCH001');
    }));

    it('should sort lot number options in descending order', fakeAsync(() => {
      const unsortedLots: LotNumberDto[] = [
        { lotNumber: 'LOT123' },
        { lotNumber: 'LOT999' },
        { lotNumber: 'LOT456' },
      ];
      apiServiceSpy.getLotNumbers.and.returnValue(of(unsortedLots));

      component.form.get('mode')?.setValue('LOT');
      tick();

      const filteredOptions = (component as any).filteredLotOptions();
      expect(filteredOptions[0].lotNumber).toBe('LOT999');
      expect(filteredOptions[1].lotNumber).toBe('LOT456');
      expect(filteredOptions[2].lotNumber).toBe('LOT123');
    }));

    it('should sort collection date options by date in descending order (newest first)', fakeAsync(() => {
      const unsortedDates: CollectionDateDto[] = [
        { collDate: '2024-05-25T00:00:00Z', formattedDate: '25-MAY-2024' },
        { collDate: '2024-05-27T00:00:00Z', formattedDate: '27-MAY-2024' },
        { collDate: '2024-05-26T00:00:00Z', formattedDate: '26-MAY-2024' },
      ];
      apiServiceSpy.getCollectionDates.and.returnValue(of(unsortedDates));

      component.form.get('mode')?.setValue('COLL DATE');
      tick();

      const filteredOptions = (component as any).filteredCollectionDateOptions();
      expect(filteredOptions[0].formattedDate).toBe('27-MAY-2024');
      expect(filteredOptions[1].formattedDate).toBe('26-MAY-2024');
      expect(filteredOptions[2].formattedDate).toBe('25-MAY-2024');
    }));

    it('should sort collection dates by actual date value not string format', fakeAsync(() => {
      const unsortedDates: CollectionDateDto[] = [
        { collDate: '2024-05-09T00:00:00Z', formattedDate: '09-MAY-2024' },
        { collDate: '2024-05-10T00:00:00Z', formattedDate: '10-MAY-2024' },
        { collDate: '2024-05-01T00:00:00Z', formattedDate: '01-MAY-2024' },
      ];
      apiServiceSpy.getCollectionDates.and.returnValue(of(unsortedDates));

      component.form.get('mode')?.setValue('COLL DATE');
      tick();

      const filteredOptions = (component as any).filteredCollectionDateOptions();
      expect(filteredOptions[0].collDate).toBe('2024-05-10T00:00:00Z');
      expect(filteredOptions[1].collDate).toBe('2024-05-09T00:00:00Z');
      expect(filteredOptions[2].collDate).toBe('2024-05-01T00:00:00Z');
    }));
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require mode field', () => {
      const modeControl = component.form.get('mode');
      expect(modeControl?.hasError('required')).toBeTrue();

      modeControl?.setValue('DRIVE');
      expect(modeControl?.hasError('required')).toBeFalse();
    });

    it('should require value field for non-COLL DATE modes', () => {
      component.form.get('mode')?.setValue('DRIVE');
      const valueControl = component.form.get('value');

      expect(valueControl?.hasError('required')).toBeTrue();

      valueControl?.setValue('DRIVE1');
      expect(valueControl?.hasError('required')).toBeFalse();
    });

    it('should require value field for COLL DATE mode', fakeAsync(() => {
      component.form.get('mode')?.setValue('COLL DATE');
      tick();

      const valueControl = component.form.get('value');
      expect(valueControl?.hasError('required')).toBeTrue();
    }));
  });
  describe('Interdictions Table', () => {
    const mockInterdictions: InterdictionDto[] = [
      { interCode: 'BLHO', interDesc: 'Bleed Time > Max. Permissible', interType: 'Hold' },
      { interCode: 'CPRH', interDesc: 'Component Prod. Review Hold', interType: 'Hold' },
    ];

    beforeEach(() => {
      fixture.detectChanges();
      (component as any).interdictions.set(mockInterdictions);
      (component as any).loading.set(false);
      fixture.detectChanges();
    });



    it('should display correct columns', () => {
      expect((component as any).displayedColumns).toEqual(['interCode', 'interDesc', 'interType']);
    });




  });

  describe('Search Functionality', () => {
    const mockInterdictions: InterdictionDto[] = [
      { interCode: 'BLHO', interDesc: 'Bleed Time > Max. Permissible', interType: 'Hold' },
      { interCode: 'CPRH', interDesc: 'Component Prod. Review Hold', interType: 'Hold' },
      { interCode: 'TEST', interDesc: 'Test Description', interType: 'NFT' },
    ];

    beforeEach(() => {
      fixture.detectChanges();
      (component as any).interdictions.set(mockInterdictions);
      (component as any).loading.set(false);
      fixture.detectChanges();
    });



    it('should show all interdictions when search is empty', () => {
      component.onSearch('');
      const filtered = (component as any).filteredInterdictions();

      expect(filtered.length).toBe(3);
    });


  });

  describe('View Units Action', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).interdictions.set([
        { interCode: 'CODE1', interDesc: 'Test', interType: 'Hold' },
      ]);
      fixture.detectChanges();
    });





    it('should pass correct data to dialog', () => {
      component.form.get('mode')?.setValue('DRIVE');
      component.form.get('value')?.setValue('DRIVE1');

      (component as any).onViewUnits();

      expect(dialog.open).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          data: {
            controlMode: 'DRIVE',
            selectionValue: 'DRIVE1',
          },
        })
      );
    });
  });

  describe('Add Interdiction Action', () => {
    it('should open add panel and load active interdictions when ADD INTERDICTION clicked', () => {
      fixture.detectChanges();
      (component as any).interdictions.set([{ interCode: 'CODE1', interDesc: 'Test', interType: 'Hold' }]);
      fixture.detectChanges();

      (component as any).onAddInterdiction();

      expect((component as any).activeSidePanel()).toBe('add');
      expect(apiServiceSpy.getActiveInterdictions).toHaveBeenCalled();
    });

    it('should close add panel on save without reloading', () => {
      fixture.detectChanges();
      spyOn<any>(component, 'loadInterdictionsForGroup');

      (component as any).onAddPanelClosed(true);

      expect((component as any).activeSidePanel()).toBeNull();
      expect((component as any).loadInterdictionsForGroup).not.toHaveBeenCalled();
    });

    it('should close add panel without reload on cancel', () => {
      fixture.detectChanges();
      spyOn<any>(component, 'loadInterdictionsForGroup');

      (component as any).onAddPanelClosed(false);

      expect((component as any).activeSidePanel()).toBeNull();
      expect((component as any).loadInterdictionsForGroup).not.toHaveBeenCalled();
    });

    it('should add interdiction to grid via onInterdictionPlaced', () => {
      fixture.detectChanges();
      const newInterdiction: InterdictionDto = { interCode: 'NEW1', interDesc: 'New Interdiction', interType: 'Hold' };

      (component as any).onInterdictionPlaced(newInterdiction);

      expect((component as any).interdictions()).toContain(newInterdiction);
    });

    it('should not add duplicate interdiction via onInterdictionPlaced', () => {
      fixture.detectChanges();
      const existing: InterdictionDto = { interCode: 'CODE1', interDesc: 'Existing', interType: 'Hold' };
      (component as any).interdictions.set([existing]);

      (component as any).onInterdictionPlaced({ interCode: 'CODE1', interDesc: 'Duplicate', interType: 'Hold' });

      expect((component as any).interdictions().length).toBe(1);
    });
  });

  describe('Edit Interdiction Action', () => {
    const mockInterdiction: InterdictionDto = {
      interCode: 'CODE1',
      interDesc: 'Test Interdiction',
      interType: 'Hold',
    };

    it('should open edit panel and load active interdictions when edit icon clicked', () => {
      fixture.detectChanges();

      (component as any).onEditInterdiction(mockInterdiction);

      expect((component as any).activeSidePanel()).toBe('edit');
      expect((component as any).editingInterdiction()).toEqual(mockInterdiction);
      expect(apiServiceSpy.getActiveInterdictions).toHaveBeenCalled();
    });

    it('should close edit panel and reload on save', () => {
      fixture.detectChanges();
      spyOn<any>(component, 'loadInterdictionsForGroup');

      (component as any).onEditPanelClosed(true);

      expect((component as any).activeSidePanel()).toBeNull();
      expect((component as any).editingInterdiction()).toBeNull();
      expect((component as any).loadInterdictionsForGroup).toHaveBeenCalled();
    });
  });



  describe('Date Formatting', () => {




    it('should handle undefined dates', () => {
      const formatted = (component as any).formatDate(undefined);
      expect(formatted).toBe('');
    });
  });
});
