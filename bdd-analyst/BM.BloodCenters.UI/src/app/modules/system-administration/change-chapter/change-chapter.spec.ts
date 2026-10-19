import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeChapterComponent } from './change-chapter';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ChangeChapterWarehouseService } from './services/change-chapter-warehouse.service';
import { HeaderService } from '../../../shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('ChangeChapterComponent', () => {
  let component: ChangeChapterComponent;
  let fixture: ComponentFixture<ChangeChapterComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ChangeChapterComponent>>;
  let serviceSpy: jasmine.SpyObj<ChangeChapterWarehouseService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackBarOpenSpy: jasmine.Spy;

  const mockDialogData = {
    chapterId: 'DAL',
    warehouseId: 'D',
    chapterName: 'Dallas',
    warehouseName: 'Dallas Warehouse'
  };

  const mockChapters = [
    { chapterId: 'DAL', chapterName: 'Dallas' },
    { chapterId: 'WAD', chapterName: 'Your Blood Center' }
  ];

  const mockWarehouses = [
    { warehouseId: 'D', warehouseName: 'Dallas Warehouse' },
    { warehouseId: 'H', warehouseName: 'Home Warehouse' }
  ];

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    serviceSpy = jasmine.createSpyObj('ChangeChapterWarehouseService', [
      'getAllChapters',
      'getWarehousesByChapter',
      'updateChapterAndWarehouse',
      'getChapterDetails'
    ]);

    headerServiceSpy = createMockHeaderService({
      headerConfig: signal({
        title: 'Blood Centers',
        subtitle: '',
        logoUrl: 'logo.png',
        user: {
          name: 'Test User',
          id: 'TEST123',
          role: 'Admin'
        }
      })
    });

    serviceSpy.getAllChapters.and.returnValue(
      of([{ chapterId: 'WAD', chapterName: 'Your Blood Center' }])
    );

    serviceSpy.getWarehousesByChapter.and.returnValue(
      of([{ warehouseId: 'H', warehouseName: 'Home Warehouse' }])
    );

    serviceSpy.updateChapterAndWarehouse.and.returnValue(
      of({
        message: 'success',
        oldChapterId: 'DAL',
        newChapterId: 'WAD',
        oldWarehouseId: 'D',
        newWarehouseId: 'H'
      })
    );

    serviceSpy.getChapterDetails.and.returnValue(
      of({
        chapterId: 'WAD',
        chapterName: 'Your Blood Center',
        chapterTimezone: 'America/Chicago'
      })
    );



      TestBed.configureTestingModule({
      imports: [
        ChangeChapterComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: ChangeChapterWarehouseService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { ...mockDialogData }
        }
      ]
    });



      dialogRefSpy.close.calls.reset();
      serviceSpy.getAllChapters.calls.reset();
      serviceSpy.getWarehousesByChapter.calls.reset();
      serviceSpy.updateChapterAndWarehouse.calls.reset();
      serviceSpy.getChapterDetails.calls.reset();
      headerServiceSpy.updateChapterAndWarehouse.calls.reset();

    fixture = TestBed.createComponent(ChangeChapterComponent);
    component = fixture.componentInstance;

    // Spy on the real MatSnackBar instance injected into the component
    snackBarOpenSpy = spyOn((component as any).snackBar, 'open');

    fixture.detectChanges();
    });

  // ----------------------------------------------------------------
  // COMPONENT CREATION
  // ----------------------------------------------------------------

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ----------------------------------------------------------------
  // ngOnInit - FORM INITIALIZATION
  // ----------------------------------------------------------------

  it('should initialize the form with chapterId and warehouseId controls', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('chapterId')).toBeTruthy();
    expect(component.form.get('warehouseId')).toBeTruthy();
  });

  it('should set chapterId as required', () => {
    component.form.get('chapterId')!.setValue(null);
    expect(component.form.get('chapterId')!.hasError('required')).toBeTrue();
  });

  it('should set warehouseId as required', () => {
    component.form.get('warehouseId')!.setValue(null);
    expect(component.form.get('warehouseId')!.hasError('required')).toBeTrue();
  });

  // ----------------------------------------------------------------
  // ngOnInit - DIALOG DATA BINDING
  // ----------------------------------------------------------------

  it('should set previousChapter from dialog data', () => {
    expect(component.previousChapter).toBe('DAL');
  });

  it('should set previousWarehouse from dialog data', () => {
    expect(component.previousWarehouse).toBe('D');
  });

  it('should set previousChapterName from dialog data', () => {
    expect(component.previousChapterName).toBeDefined();
  });

  it('should set previousWarehouseName after warehouse loads', () => {
    expect(component.previousWarehouseName).toBeDefined();
  });

  // ----------------------------------------------------------------
  // ngOnInit - CHAPTERS LOADING
  // ----------------------------------------------------------------

  it('should call getAllChapters on init', () => {
    expect(serviceSpy.getAllChapters).toHaveBeenCalledTimes(1);
  });

  it('should populate chapters array after loading', () => {
    expect(component.chapters.length).toBeGreaterThan(0);
  });

  it('should patch chapterId form value with dialog data chapterId', () => {
    expect(component.form.get('chapterId')!.value).toBe('DAL');
  });

  it('should call loadWarehouses after chapters load', () => {
    expect(serviceSpy.getWarehousesByChapter).toHaveBeenCalled();
  });

  it('should handle null chapters response', () => {
    serviceSpy.getAllChapters.and.returnValue(of(null as any));
    serviceSpy.getWarehousesByChapter.and.returnValue(of([]));

    const newFixture = TestBed.createComponent(ChangeChapterComponent);
    const newComponent = newFixture.componentInstance;
    spyOn((newComponent as any).snackBar, 'open');
    newFixture.detectChanges();

    expect(newComponent.chapters).toEqual([]);
  });

  it('should show error snackbar when chapters fail to load', () => {
    serviceSpy.getAllChapters.and.returnValue(throwError(() => new Error('Network error')));

    const newFixture = TestBed.createComponent(ChangeChapterComponent);
    const newComponent = newFixture.componentInstance;
    const newSnackBarOpenSpy = spyOn((newComponent as any).snackBar, 'open');
    newFixture.detectChanges();

    expect(newSnackBarOpenSpy).toHaveBeenCalledWith(
      'Failed to load chapters',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  // ----------------------------------------------------------------
  // ngOnInit - WAREHOUSES LOADING (loadWarehouses)
  // ----------------------------------------------------------------

  it('should populate warehouses array after loading', () => {
    expect(component.warehouses.length).toBeGreaterThan(0);
  });

  it('should preselect warehouseId when preselectWarehouse is provided', () => {
    serviceSpy.getWarehousesByChapter.and.returnValue(
      of([{ warehouseId: 'D', warehouseName: 'Dallas Warehouse' }])
    );
    serviceSpy.getAllChapters.and.returnValue(
      of([{ chapterId: 'DAL', chapterName: 'Dallas' }])
    );

    const newFixture = TestBed.createComponent(ChangeChapterComponent);
    const newComponent = newFixture.componentInstance;
    spyOn((newComponent as any).snackBar, 'open');
    newFixture.detectChanges();

    expect(newComponent.form.get('warehouseId')!.value).toBe('D');
    expect(newComponent.previousWarehouseName).toBe('Dallas Warehouse');
  });

  it('should handle null warehouses response', () => {
    serviceSpy.getWarehousesByChapter.and.returnValue(of(null as any));
    serviceSpy.getAllChapters.and.returnValue(
      of([{ chapterId: 'DAL', chapterName: 'Dallas' }])
    );

    const newFixture = TestBed.createComponent(ChangeChapterComponent);
    const newComponent = newFixture.componentInstance;
    spyOn((newComponent as any).snackBar, 'open');
    newFixture.detectChanges();

    expect(newComponent.warehouses).toEqual([]);
  });

  it('should show error snackbar when warehouses fail to load', () => {
    serviceSpy.getAllChapters.and.returnValue(
      of([{ chapterId: 'DAL', chapterName: 'Dallas' }])
    );
    serviceSpy.getWarehousesByChapter.and.returnValue(throwError(() => new Error('Network error')));

    const newFixture = TestBed.createComponent(ChangeChapterComponent);
    const newComponent = newFixture.componentInstance;
    const newSnackBarOpenSpy = spyOn((newComponent as any).snackBar, 'open');
    newFixture.detectChanges();

    expect(newSnackBarOpenSpy).toHaveBeenCalledWith(
      'Failed to load warehouses',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should set previousWarehouseName to empty string when preselected warehouse not found', () => {
    serviceSpy.getWarehousesByChapter.and.returnValue(
      of([{ warehouseId: 'X', warehouseName: 'Other' }])
    );
    serviceSpy.getAllChapters.and.returnValue(
      of([{ chapterId: 'DAL', chapterName: 'Dallas' }])
    );

    const newFixture = TestBed.createComponent(ChangeChapterComponent);
    const newComponent = newFixture.componentInstance;
    spyOn((newComponent as any).snackBar, 'open');
    newFixture.detectChanges();

    expect(newComponent.previousWarehouseName).toBe('');
  });

  // ----------------------------------------------------------------
  // ngOnInit - CHAPTER VALUE CHANGES SUBSCRIPTION
  // ----------------------------------------------------------------

  it('should reset warehouseId when chapterId changes', () => {
    component.chapters = mockChapters;
    component.form.get('warehouseId')!.setValue('H');

    component.form.get('chapterId')!.setValue('WAD');

    expect(component.form.get('warehouseId')!.value).toBeNull();
  });

  it('should update previousChapterName when chapterId changes to a valid chapter', () => {
    component.chapters = mockChapters;

    component.form.get('chapterId')!.setValue('WAD');

    expect(component.previousChapterName).toBe('Your Blood Center');
  });

  it('should set previousChapterName to empty string when chapter not found', () => {
    component.chapters = mockChapters;

    component.form.get('chapterId')!.setValue('UNKNOWN');

    expect(component.previousChapterName).toBe('');
  });

  it('should clear previousWarehouseName when chapterId changes', () => {
    component.previousWarehouseName = 'Some Warehouse';
    component.chapters = mockChapters;

    component.form.get('chapterId')!.setValue('WAD');

    expect(component.previousWarehouseName).toBe('');
  });

  it('should call loadWarehouses with new chapterId when chapter changes', () => {
    serviceSpy.getWarehousesByChapter.calls.reset();
    component.chapters = mockChapters;

    component.form.get('chapterId')!.setValue('WAD');

    expect(serviceSpy.getWarehousesByChapter).toHaveBeenCalledWith('WAD');
  });

  it('should not load warehouses when chapterId is set to null/falsy', () => {
    serviceSpy.getWarehousesByChapter.calls.reset();

    component.form.get('chapterId')!.setValue(null);

    expect(serviceSpy.getWarehousesByChapter).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // ngOnInit - WAREHOUSE VALUE CHANGES SUBSCRIPTION
  // ----------------------------------------------------------------

  it('should update previousWarehouseName when warehouseId changes to a valid warehouse', () => {
    component.warehouses = mockWarehouses;

    component.form.get('warehouseId')!.setValue('H');

    expect(component.previousWarehouseName).toBe('Home Warehouse');
  });

  it('should set previousWarehouseName to empty string when warehouse not found', () => {
    component.warehouses = mockWarehouses;

    component.form.get('warehouseId')!.setValue('UNKNOWN');

    expect(component.previousWarehouseName).toBe('');
  });

  it('should set previousWarehouseName to empty string when warehouseId is null', () => {
    component.warehouses = mockWarehouses;

    component.form.get('warehouseId')!.setValue(null);

    expect(component.previousWarehouseName).toBe('');
  });

  // ----------------------------------------------------------------
  // close()
  // ----------------------------------------------------------------

  it('should close the dialog with false', () => {
    component.close();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('should close the dialog exactly once', () => {
    component.close();

    expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
  });

  // ----------------------------------------------------------------
  // submit() - VALIDATION
  // ----------------------------------------------------------------

  it('should show error and not call service when form is invalid', () => {
    component.form.get('chapterId')!.setValue(null);
    component.form.get('warehouseId')!.setValue(null);
    snackBarOpenSpy.calls.reset();

    component.submit();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Please select Chapter and Warehouse',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
    expect(serviceSpy.updateChapterAndWarehouse).not.toHaveBeenCalled();
  });

  it('should show error when chapter is selected but warehouse is not', () => {
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue(null);
    snackBarOpenSpy.calls.reset();

    component.submit();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Please select Chapter and Warehouse',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  // ----------------------------------------------------------------
  // submit() - INVALID SELECTION (chapter or warehouse not in arrays)
  // ----------------------------------------------------------------

  it('should show "Invalid selection" when chapter not found in chapters array', () => {
    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('NONEXISTENT');
    component.form.get('warehouseId')!.setValue('H');
    snackBarOpenSpy.calls.reset();

    component.submit();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Invalid selection',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
    expect(serviceSpy.updateChapterAndWarehouse).not.toHaveBeenCalled();
  });

  it('should show "Invalid selection" when warehouse not found in warehouses array', () => {
    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('NONEXISTENT');
    snackBarOpenSpy.calls.reset();

    component.submit();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Invalid selection',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
    expect(serviceSpy.updateChapterAndWarehouse).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // submit() - USER ID MISSING
  // ----------------------------------------------------------------

  it('should show error when userId is not found in headerConfig', () => {
    (headerServiceSpy as any).headerConfig = signal({
      title: 'Blood Centers',
      subtitle: '',
      logoUrl: 'logo.png',
      user: null
    });

    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');
    snackBarOpenSpy.calls.reset();

    component.submit();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'User ID not found. Please try logging in again.',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
    expect(serviceSpy.updateChapterAndWarehouse).not.toHaveBeenCalled();
  });

  it('should show error when headerConfig is null', () => {
    (headerServiceSpy as any).headerConfig = signal(null);

    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');
    snackBarOpenSpy.calls.reset();

    component.submit();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'User ID not found. Please try logging in again.',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
    expect(serviceSpy.updateChapterAndWarehouse).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // submit() - SUCCESS
  // ----------------------------------------------------------------

  it('should call service and close dialog on submit', () => {
    component.chapters = [
      { chapterId: 'WAD', chapterName: 'Your Blood Center' }
    ];

    component.form.get('chapterId')!.setValue('WAD');

    component.warehouses = [
      { warehouseId: 'H', warehouseName: 'Home Warehouse' }
    ];
    component.form.get('warehouseId')!.enable();
    component.form.get('warehouseId')!.setValue('H');

    component.submit();

    expect(serviceSpy.updateChapterAndWarehouse).toHaveBeenCalled();
    expect(serviceSpy.getChapterDetails).toHaveBeenCalledWith('WAD');
    expect(headerServiceSpy.updateChapterAndWarehouse).toHaveBeenCalledWith(
      'WAD',
      'Your Blood Center',
      'H',
      'Home Warehouse',
      'America/Chicago'
    );
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });


  it('should update header service when chapter is changed successfully', () => {
    component.chapters = [
      { chapterId: 'WAD', chapterName: 'Your Blood Center' }
    ];

    component.form.get('chapterId')!.setValue('WAD');

    component.warehouses = [
      { warehouseId: 'H', warehouseName: 'Home Warehouse' }
    ];
    component.form.get('warehouseId')!.enable();
    component.form.get('warehouseId')!.setValue('H');

    component.submit();

    expect(headerServiceSpy.updateChapterAndWarehouse).toHaveBeenCalledTimes(1);
    expect(headerServiceSpy.updateChapterAndWarehouse).toHaveBeenCalledWith(
      'WAD',
      'Your Blood Center',
      'H',
      'Home Warehouse',
      'America/Chicago'
    );
  });

  it('should build correct payload with userId from headerConfig', () => {
    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');

    component.submit();

    expect(serviceSpy.updateChapterAndWarehouse).toHaveBeenCalledWith(
      jasmine.objectContaining({
        userId: 'TEST123',
        oldChapterId: 'DAL',
        oldWarehouseId: 'D',
        newChapterId: 'WAD',
        newChapterName: 'Your Blood Center',
        newWarehouseId: 'H',
        newWarehouseName: 'Home Warehouse'
      })
    );
  });

  it('should remove driveContext from sessionStorage on successful submit', () => {
    sessionStorage.setItem('driveContext', 'test-value');

    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');

    component.submit();

    expect(sessionStorage.getItem('driveContext')).toBeNull();
  });

  it('should remove labelPrinterContext from sessionStorage on successful submit', () => {
    sessionStorage.setItem('labelPrinterContext', 'test-value');

    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');

    component.submit();

    expect(sessionStorage.getItem('labelPrinterContext')).toBeNull();
  });

  it('should show success snackbar with correct message on successful submit', () => {
    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');
    snackBarOpenSpy.calls.reset();

    component.submit();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Your chapter is now "WAD" and your warehouse is now "H"',
      'DISMISS',
      jasmine.objectContaining({
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      })
    );
  });

  it('should close dialog with true on successful submit', () => {
    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');

    component.submit();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  // ----------------------------------------------------------------
  // submit() - ERROR HANDLING
  // ----------------------------------------------------------------

  it('should show error message from backend when update fails with error message', () => {
    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');

    serviceSpy.updateChapterAndWarehouse.and.returnValue(
      throwError(() => ({ error: { message: 'Insufficient permissions' } }))
    );
    snackBarOpenSpy.calls.reset();

    component.submit();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Insufficient permissions',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should show "Update failed" when error has no message', () => {
    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');

    serviceSpy.updateChapterAndWarehouse.and.returnValue(
      throwError(() => ({ error: {} }))
    );
    snackBarOpenSpy.calls.reset();

    component.submit();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Update failed',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should show "Update failed" when error object is null', () => {
    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');

    serviceSpy.updateChapterAndWarehouse.and.returnValue(
      throwError(() => null)
    );
    snackBarOpenSpy.calls.reset();

    component.submit();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Update failed',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should not close the dialog when update fails', () => {
    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');

    serviceSpy.updateChapterAndWarehouse.and.returnValue(
      throwError(() => new Error('fail'))
    );
    dialogRefSpy.close.calls.reset();

    component.submit();

    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('should not update header service when update fails', () => {
    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');

    serviceSpy.updateChapterAndWarehouse.and.returnValue(
      throwError(() => new Error('fail'))
    );
    headerServiceSpy.updateChapterAndWarehouse.calls.reset();

    component.submit();

    expect(headerServiceSpy.updateChapterAndWarehouse).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // submit() - switchMap chain (getChapterDetails failure)
  // ----------------------------------------------------------------

  it('should show error when getChapterDetails fails after successful update', () => {
    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');

    serviceSpy.getChapterDetails.and.returnValue(
      throwError(() => ({ error: { message: 'Chapter details not found' } }))
    );
    snackBarOpenSpy.calls.reset();

    component.submit();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Chapter details not found',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  // ----------------------------------------------------------------
  // showError (private, tested indirectly through public methods)
  // ----------------------------------------------------------------

  it('should configure snackbar with correct positioning options', () => {
    component.form.get('chapterId')!.setValue(null);
    component.form.get('warehouseId')!.setValue(null);
    snackBarOpenSpy.calls.reset();

    component.submit();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      jasmine.any(String),
      'DISMISS',
      jasmine.objectContaining({
        horizontalPosition: 'right',
        verticalPosition: 'top'
      })
    );
  });

  // ----------------------------------------------------------------
  // EDGE CASES
  // ----------------------------------------------------------------

  it('should handle chapters list with multiple items', () => {
    serviceSpy.getAllChapters.and.returnValue(of(mockChapters));
    serviceSpy.getWarehousesByChapter.and.returnValue(of(mockWarehouses));

    const newFixture = TestBed.createComponent(ChangeChapterComponent);
    const newComponent = newFixture.componentInstance;
    spyOn((newComponent as any).snackBar, 'open');
    newFixture.detectChanges();

    expect(newComponent.chapters.length).toBe(2);
  });

  it('should handle empty chapters list', () => {
    serviceSpy.getAllChapters.and.returnValue(of([]));
    serviceSpy.getWarehousesByChapter.and.returnValue(of([]));

    const newFixture = TestBed.createComponent(ChangeChapterComponent);
    const newComponent = newFixture.componentInstance;
    spyOn((newComponent as any).snackBar, 'open');
    newFixture.detectChanges();

    expect(newComponent.chapters).toEqual([]);
  });

  it('should handle loadWarehouses without preselectWarehouse', () => {
    component.chapters = mockChapters;
    serviceSpy.getWarehousesByChapter.and.returnValue(of(mockWarehouses));

    component.form.get('chapterId')!.setValue('WAD');

    expect(component.warehouses).toEqual(mockWarehouses);
    expect(component.form.get('warehouseId')!.value).toBeNull();
  });

  it('should use previousChapter and previousWarehouse as old values in payload', () => {
    component.chapters = [{ chapterId: 'WAD', chapterName: 'Your Blood Center' }];
    component.warehouses = [{ warehouseId: 'H', warehouseName: 'Home Warehouse' }];
    component.form.get('chapterId')!.setValue('WAD');
    component.form.get('warehouseId')!.setValue('H');

    component.submit();

    const payload = serviceSpy.updateChapterAndWarehouse.calls.mostRecent().args[0];
    expect(payload.oldChapterId).toBe('DAL');
    expect(payload.oldWarehouseId).toBe('D');
  });
});
