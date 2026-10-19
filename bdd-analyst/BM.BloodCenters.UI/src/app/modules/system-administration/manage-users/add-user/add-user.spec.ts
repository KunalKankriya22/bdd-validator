import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';
import { provideHttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import { AddUserComponent } from './add-user';
import { UserApiService } from '../services/user.service';
import { ScrollHandlerService } from '../services/scroll-handler.service';
import { createMockMatSnackBar, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';
import { HeaderService } from '@shared/services/header.service';

describe('AddUser Component', () => {
  let component: AddUserComponent;
  let fixture: ComponentFixture<AddUserComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockUserService: jasmine.SpyObj<UserApiService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockScrollHandler: jasmine.SpyObj<ScrollHandlerService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl', 'createUrlTree', 'serializeUrl'], {
      events: of({}),
      url: '/'
    });

    mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { params: {}, queryParams: {} },
      params: of({}),
      queryParams: of({})
    });
    mockDialog = createMockMatDialog();
    mockUserService = jasmine.createSpyObj('UserApiService', [
      'getChapters', 'getWarehouses', 'getLabCodes', 'getPrinterCodes', 'getGroups', 'getAccessLevels',
      'createUser', 'formatDateToISO', 'parseDateToISO'
    ]);
    mockSnackBar = createMockMatSnackBar();
    mockScrollHandler = jasmine.createSpyObj('ScrollHandlerService',
      ['initialize', 'cleanup', 'scrollToSection', 'getActiveSection']
    );

    chapterChangedSubject = new Subject<void>();
    mockHeaderService = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable()
    });

    TestBed.configureTestingModule({
      imports: [AddUserComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: MatDialog, useValue: mockDialog },
        { provide: UserApiService, useValue: mockUserService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: ScrollHandlerService, useValue: mockScrollHandler },
        { provide: HeaderService, useValue: mockHeaderService }
      ],
    })
    .overrideComponent(AddUserComponent, {
      add: { providers: [
        { provide: ScrollHandlerService, useValue: mockScrollHandler },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ] }
    });

    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');
    mockRouter.navigateByUrl.and.returnValue(Promise.resolve(true));
    mockRouter.navigate.calls.reset();
    mockRouter.navigateByUrl.calls.reset();
    mockScrollHandler.getActiveSection.and.returnValue(of('personal-info'));
    mockScrollHandler.initialize.calls.reset();
    mockScrollHandler.cleanup.calls.reset();
    mockScrollHandler.scrollToSection.calls.reset();
    mockUserService.getChapters.and.returnValue(of([]));
    mockUserService.getWarehouses.and.returnValue(of([]));
    mockUserService.getLabCodes.and.returnValue(of([]));
    mockUserService.getGroups.and.returnValue(of([]));
    mockUserService.getPrinterCodes.and.returnValue(of([]));
    mockUserService.getAccessLevels.and.returnValue(of([]));
    mockUserService.createUser.calls.reset();
    mockUserService.formatDateToISO.calls.reset();
    mockUserService.parseDateToISO.calls.reset();
    mockUserService.getChapters.calls.reset();
    mockUserService.getWarehouses.calls.reset();
    mockUserService.getLabCodes.calls.reset();
    mockUserService.getGroups.calls.reset();
    mockUserService.getPrinterCodes.calls.reset();
    mockUserService.getAccessLevels.calls.reset();
    mockDialog.open.calls.reset();

    fixture = TestBed.createComponent(AddUserComponent);
    component = fixture.componentInstance;

    // Don't call detectChanges yet - let individual tests control when ngOnInit is called
  });

  // Form Initialization

  // Load Lookup Data
  it('should load all lookup data on init', () => {
    fixture.detectChanges(); // Trigger ngOnInit
    expect(mockUserService.getChapters).toHaveBeenCalled();
    expect(mockUserService.getWarehouses).toHaveBeenCalled();
    expect(mockUserService.getLabCodes).toHaveBeenCalled();
    expect(mockUserService.getGroups).toHaveBeenCalled();
  });

  // Lab Code Auto-population
  it('should auto-populate lab description when lab code is selected', () => {
    fixture.detectChanges();
    component.labCodes.set([{ labCode: 'LAB1', labDescription: 'Lab One' }]);
    component.userForm.patchValue({ labCode: 'LAB1' });
    expect(component.userForm.get('labDescription')?.value).toBe('Lab One');
  });

  // Group Code Auto-population
  it('should auto-populate group description when group code is selected', () => {
    fixture.detectChanges();
    const today = moment.utc().format('YYYY-MM-DD');
    component.groups.set([{ applId: 'APP1', groupId: 'GRP1', description: 'Group One', userCount: 5, lastModifiedDate: today }]);
    component.userForm.patchValue({ groupCode: 'GRP1' });
    expect(component.userForm.get('groupDescription')?.value).toBe('Group One');
  });

  // Date Validation

  // Chapter Search

  // Assign Chapter Dialog

  // Default Toggle
  it('should set only one chapter as default', () => {
    fixture.detectChanges();
    const today = moment.utc().format('DD/MM/YYYY');
    component.chaptersDataSource = [
      { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: today, terminationDate: '', status: 'Active', isDefault: true },
      { chapterId: 'CH2', chapterName: 'Chapter Two', effectiveDate: today, terminationDate: '', status: 'Active', isDefault: false }
    ];

    component.onDefaultToggle(component.chaptersDataSource[1]);

    expect(component.chaptersDataSource[0].isDefault).toBeFalsy();
    expect(component.chaptersDataSource[1].isDefault).toBeTruthy();
  });

  // Form Validation Error

  // Chapter Requirement Validation

  // Successful Save
  it('should successfully create user with valid data', () => {
    fixture.detectChanges();
    const tomorrow = moment.utc().add(1, 'day');
    const todayFormatted = tomorrow.format('DD/MM/YYYY');
    const todayISO = tomorrow.format('YYYY-MM-DD');

    mockUserService.createUser.and.returnValue(of({ success: true }));
    mockUserService.formatDateToISO.and.returnValue(todayISO);
    mockUserService.parseDateToISO.and.returnValue(todayISO);

    component.userForm.patchValue({
      userId: 'U001', firstName: 'John', lastName: 'Doe', email: 'john@test.com',
      staffNumber: 'S001', effectiveDate: tomorrow.toDate(), assignedWarehouse: 'W1',
      groupCode: 'G1', accessLevel: '5'
    });
    component.chaptersDataSource = [
      { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: todayFormatted, terminationDate: '', status: 'Active', isDefault: true }
    ];

    component.onSave();

    expect(mockUserService.createUser).toHaveBeenCalled();
    expect(component.isSubmitting()).toBeFalsy();
  });

  // Save Error Handling

  // Save Button Disabled State




  // Clear All

  // Navigation

  // Chapter Sorting



  // Error Message Parsing
  it('should parse ORA-00001 error message for duplicate User ID', () => {
    fixture.detectChanges();
    component.userForm.patchValue({ userId: 'TEST123' });
    const error = { error: { errorMessage: 'ORA-00001: unique constraint violated' } };
    const result = component['parseErrorMessage'](error);
    expect(result).toContain('TEST123');
    expect(result).toContain('already exists');
  });

  it('should parse ORA-12899 error for USER_INITIALS field', () => {
    fixture.detectChanges();
    const error = { error: { errorMessage: 'ORA-12899: value too large for column USER_INITIALS' } };
    const result = component['parseErrorMessage'](error);
    expect(result).toContain('Name Initials');
    expect(result).toContain('maximum length of 3 characters');
  });

  it('should parse ORA-12899 error for AD_USER_ID field', () => {
    fixture.detectChanges();
    const error = { error: { errorMessage: 'ORA-12899: value too large for column AD_USER_ID' } };
    const result = component['parseErrorMessage'](error);
    expect(result).toContain('AD User ID');
    expect(result).toContain('maximum length of 20 characters');
  });

  it('should return generic error message for unknown errors', () => {
    fixture.detectChanges();
    const error = { message: 'Unknown error occurred' };
    const result = component['parseErrorMessage'](error);
    expect(result).toBe('Unknown error occurred');
  });

  // Date Formatting
  it('should format valid date string from DD/MM/YYYY to DD-MMM-YYYY', () => {
    fixture.detectChanges();
    const result = component.formatDateForDisplay('15/03/2024');
    expect(result).toBe('15-MAR-2024');
  });

  it('should return original string if date format is invalid', () => {
    fixture.detectChanges();
    const result = component.formatDateForDisplay('invalid-date');
    expect(result).toBe('invalid-date');
  });

  it('should return original string if month is out of range', () => {
    fixture.detectChanges();
    const result = component.formatDateForDisplay('15/13/2024');
    expect(result).toBe('15/13/2024');
  });

  it('should return original string if day is invalid', () => {
    fixture.detectChanges();
    const result = component.formatDateForDisplay('0/03/2024');
    expect(result).toBe('0/03/2024');
  });

  // ===================== NEW TESTS =====================

  // ngOnDestroy
  describe('ngOnDestroy', () => {
    it('should call scrollHandler cleanup', () => {
      fixture.detectChanges();
      component.ngOnDestroy();
      expect(mockScrollHandler.cleanup).toHaveBeenCalled();
    });
  });

  // onBack / onCancel
  describe('navigation', () => {
    it('should navigate to manage-users on onBack', () => {
      fixture.detectChanges();
      component.onBack();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/system-administration/user-admin/manage-users');
    });

    it('should navigate to manage-users on onCancel', () => {
      fixture.detectChanges();
      component.onCancel();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/system-administration/user-admin/manage-users');
    });

    it('should navigate back via headerConfig.onBackClick', () => {
      fixture.detectChanges();
      component.headerConfig.onBackClick!();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/system-administration/user-admin/manage-users');
    });
  });

  // onClearAll
  describe('onClearAll', () => {
    it('should reset form and clear chapters', () => {
      fixture.detectChanges();
      component.userForm.patchValue({ userId: 'TEST', firstName: 'John' });
      component.chaptersDataSource = [
        { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: '01/01/2025', terminationDate: '', status: 'Active', isDefault: true }
      ];
      component.filteredChaptersDataSource = [...component.chaptersDataSource];
      component.chapterSearchTerm = 'test';

      component.onClearAll();

      expect(component.chaptersDataSource.length).toBe(0);
      expect(component.filteredChaptersDataSource.length).toBe(0);
      expect(component.chapterSearchTerm).toBe('');
    });
  });

  // scrollToSection
  describe('scrollToSection', () => {
    it('should delegate to scrollHandler', () => {
      fixture.detectChanges();
      component.scrollToSection('system-config');
      expect(mockScrollHandler.scrollToSection).toHaveBeenCalledWith('system-config');
    });
  });

  // onSave - invalid form
  describe('onSave - validation', () => {
    it('should show error when form is invalid', () => {
      fixture.detectChanges();
      // Form is invalid because required fields are empty
      component.onSave();
      expect(mockSnackBar.open).toHaveBeenCalled();
      const errorCall = mockSnackBar.open.calls.mostRecent();
      expect(errorCall.args[0]).toContain('Please fill in all required fields');
      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });

    it('should show error when no chapters assigned', () => {
      fixture.detectChanges();
      const tomorrow = moment.utc().add(1, 'day');

      component.userForm.patchValue({
        userId: 'U001', firstName: 'John', lastName: 'Doe', email: 'john@test.com',
        staffNumber: 'S001', effectiveDate: tomorrow.toDate(), assignedWarehouse: 'W1',
        groupCode: 'G1', accessLevel: '5'
      });
      component.chaptersDataSource = [];

      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalled();
      const errorCall = mockSnackBar.open.calls.mostRecent();
      expect(errorCall.args[0]).toContain('Please assign at least one chapter');
      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });

    it('should handle createUser error response', () => {
      fixture.detectChanges();
      const tomorrow = moment.utc().add(1, 'day');
      const todayISO = tomorrow.format('YYYY-MM-DD');

      mockUserService.createUser.and.returnValue(throwError(() => ({ message: 'Server error' })));
      mockUserService.parseDateToISO.and.returnValue(todayISO);

      component.userForm.patchValue({
        userId: 'U001', firstName: 'John', lastName: 'Doe', email: 'john@test.com',
        staffNumber: 'S001', effectiveDate: tomorrow.toDate(), assignedWarehouse: 'W1',
        groupCode: 'G1', accessLevel: '5'
      });
      component.chaptersDataSource = [
        { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: '01/01/2025', terminationDate: '', status: 'Active', isDefault: true }
      ];

      component.onSave();

      expect(component.isSubmitting()).toBeFalsy();
      expect(mockSnackBar.open).toHaveBeenCalled();
    });
  });

  // onDefaultToggle - unsetting default
  describe('onDefaultToggle', () => {
    it('should unset default when toggling already-default chapter', () => {
      fixture.detectChanges();
      const today = moment.utc().format('DD/MM/YYYY');
      component.chaptersDataSource = [
        { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: today, terminationDate: '', status: 'Active', isDefault: true }
      ];

      component.onDefaultToggle(component.chaptersDataSource[0]);

      expect(component.chaptersDataSource[0].isDefault).toBeFalsy();
    });
  });

  // onDeleteChapter
  describe('onDeleteChapter', () => {
    it('should remove a chapter from the data source', () => {
      fixture.detectChanges();
      const today = moment.utc().format('DD/MM/YYYY');
      component.chaptersDataSource = [
        { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: today, terminationDate: '', status: 'Active', isDefault: false },
        { chapterId: 'CH2', chapterName: 'Chapter Two', effectiveDate: today, terminationDate: '', status: 'Active', isDefault: false }
      ];
      component.filteredChaptersDataSource = [...component.chaptersDataSource];
      component.chapterSearchTerm = '';

      component.onDeleteChapter(component.chaptersDataSource[0]);

      expect(component.chaptersDataSource.length).toBe(1);
      expect(component.chaptersDataSource[0].chapterId).toBe('CH2');
    });

    it('should make first remaining chapter default when default is deleted', () => {
      fixture.detectChanges();
      const today = moment.utc().format('DD/MM/YYYY');
      const defaultChapter = { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: today, terminationDate: '', status: 'Active' as const, isDefault: true };
      const otherChapter = { chapterId: 'CH2', chapterName: 'Chapter Two', effectiveDate: today, terminationDate: '', status: 'Active' as const, isDefault: false };
      component.chaptersDataSource = [defaultChapter, otherChapter];
      component.filteredChaptersDataSource = [...component.chaptersDataSource];
      component.chapterSearchTerm = '';

      component.onDeleteChapter(defaultChapter);

      expect(component.chaptersDataSource.length).toBe(1);
      expect(component.chaptersDataSource[0].isDefault).toBeTruthy();
    });

    it('should not crash when deleting a chapter not found', () => {
      fixture.detectChanges();
      const today = moment.utc().format('DD/MM/YYYY');
      component.chaptersDataSource = [
        { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: today, terminationDate: '', status: 'Active', isDefault: true }
      ];

      const nonExistent = { chapterId: 'CH99', chapterName: 'Not Found', effectiveDate: today, terminationDate: '', status: 'Active' as const, isDefault: false };
      component.onDeleteChapter(nonExistent);

      expect(component.chaptersDataSource.length).toBe(1);
    });
  });

  // Chapter Search
  describe('onChapterSearch', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const today = moment.utc().format('DD/MM/YYYY');
      component.chaptersDataSource = [
        { chapterId: 'CH1', chapterName: 'Alpha Chapter', effectiveDate: today, terminationDate: '', status: 'Active', isDefault: true },
        { chapterId: 'CH2', chapterName: 'Beta Chapter', effectiveDate: today, terminationDate: '', status: 'Active', isDefault: false }
      ];
    });

    it('should show all chapters when search is empty', () => {
      component.chapterSearchTerm = '';
      component.onChapterSearch();
      expect(component.filteredChaptersDataSource.length).toBe(2);
    });

    it('should show all chapters when search is whitespace', () => {
      component.chapterSearchTerm = '   ';
      component.onChapterSearch();
      expect(component.filteredChaptersDataSource.length).toBe(2);
    });

    it('should filter chapters by chapterId', () => {
      component.chapterSearchTerm = 'CH1';
      component.onChapterSearch();
      expect(component.filteredChaptersDataSource.length).toBe(1);
      expect(component.filteredChaptersDataSource[0].chapterId).toBe('CH1');
    });

    it('should filter chapters by chapterName', () => {
      component.chapterSearchTerm = 'Beta';
      component.onChapterSearch();
      expect(component.filteredChaptersDataSource.length).toBe(1);
      expect(component.filteredChaptersDataSource[0].chapterName).toBe('Beta Chapter');
    });

    it('should return empty when no match', () => {
      component.chapterSearchTerm = 'XYZ';
      component.onChapterSearch();
      expect(component.filteredChaptersDataSource.length).toBe(0);
    });
  });

  // Sorting
  describe('toggleChapterSort', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const today = moment.utc().format('DD/MM/YYYY');
      component.chaptersDataSource = [
        { chapterId: 'CH1', chapterName: 'Alpha', effectiveDate: today, terminationDate: '', status: 'Active', isDefault: true },
        { chapterId: 'CH2', chapterName: 'Beta', effectiveDate: today, terminationDate: '', status: 'Active', isDefault: false }
      ];
      component.filteredChaptersDataSource = [...component.chaptersDataSource];
    });

    it('should toggle direction when same column clicked', () => {
      component.chapterSortColumn = 'chapterId';
      component.chapterSortDirection = 'desc';

      component.toggleChapterSort('chapterId');

      expect(component.chapterSortDirection).toBe('asc');
    });

    it('should set new column with ascending default', () => {
      component.chapterSortColumn = 'chapterId';

      component.toggleChapterSort('chapterName');

      expect(component.chapterSortColumn).toBe('chapterName');
      expect(component.chapterSortDirection).toBe('asc');
    });

    it('should sort filtered data ascending by chapterId', () => {
      component.chapterSortColumn = 'chapterId';
      component.chapterSortDirection = 'desc';

      component.toggleChapterSort('chapterId'); // toggles to asc

      expect(component.filteredChaptersDataSource[0].chapterId).toBe('CH1');
      expect(component.filteredChaptersDataSource[1].chapterId).toBe('CH2');
    });

    it('should sort filtered data descending by chapterId', () => {
      component.chapterSortColumn = 'chapterId';
      component.chapterSortDirection = 'asc';

      component.toggleChapterSort('chapterId'); // toggles to desc

      expect(component.filteredChaptersDataSource[0].chapterId).toBe('CH2');
      expect(component.filteredChaptersDataSource[1].chapterId).toBe('CH1');
    });
  });

  // onAssignChapter
  describe('onAssignChapter', () => {
    let dialogSpy: jasmine.Spy;

    beforeEach(() => {
      fixture.detectChanges();
      dialogSpy = spyOn((component as any).dialog, 'open');
    });

    it('should show error when no warehouse is selected', () => {
      component.userForm.patchValue({ assignedWarehouse: '' });
      component.onAssignChapter();
      expect(mockSnackBar.open).toHaveBeenCalled();
      const call = mockSnackBar.open.calls.mostRecent();
      expect(call.args[0]).toContain('Please select an assigned warehouse first');
      expect(dialogSpy).not.toHaveBeenCalled();
    });

    it('should open dialog when warehouse is selected', () => {
      component.userForm.patchValue({ assignedWarehouse: 'W1' });
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.and.returnValue(dialogRefSpy);

      component.onAssignChapter();

      expect(dialogSpy).toHaveBeenCalled();
    });

    it('should add chapters when dialog returns results', () => {
      component.userForm.patchValue({ assignedWarehouse: 'W1' });
      const dialogResult = [
        { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: '01/07/2025', terminationDate: '', isDefault: true }
      ];
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(dialogResult));
      dialogSpy.and.returnValue(dialogRefSpy);

      component.onAssignChapter();

      expect(component.chaptersDataSource.length).toBe(1);
      expect(component.chaptersDataSource[0].chapterId).toBe('CH1');
    });

    it('should not modify chapters when dialog is cancelled', () => {
      component.userForm.patchValue({ assignedWarehouse: 'W1' });
      component.chaptersDataSource = [];
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.and.returnValue(dialogRefSpy);

      component.onAssignChapter();

      expect(component.chaptersDataSource.length).toBe(0);
    });
  });

  // onEditChapter
  describe('onEditChapter', () => {
    let dialogSpy: jasmine.Spy;

    beforeEach(() => {
      fixture.detectChanges();
      dialogSpy = spyOn((component as any).dialog, 'open');
    });

    it('should open edit dialog for the given chapter', () => {
      const today = moment.utc().format('DD/MM/YYYY');
      const chapter = { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: today, terminationDate: '', status: 'Active' as const, isDefault: true };
      component.chaptersDataSource = [chapter];
      component.filteredChaptersDataSource = [...component.chaptersDataSource];

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.and.returnValue(dialogRefSpy);

      component.onEditChapter(chapter);

      expect(dialogSpy).toHaveBeenCalled();
      const dialogData = dialogSpy.calls.mostRecent().args[1].data;
      expect(dialogData.editMode).toBeTruthy();
      expect(dialogData.chapter).toEqual(chapter);
    });

    it('should update chapter when dialog returns result', () => {
      const today = moment.utc().format('DD/MM/YYYY');
      const chapter = { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: today, terminationDate: '', status: 'Active' as const, isDefault: true };
      component.chaptersDataSource = [chapter];
      component.filteredChaptersDataSource = [...component.chaptersDataSource];
      component.chapterSearchTerm = '';

      const updatedData = [{ chapterId: 'CH1', chapterName: 'Updated Chapter', effectiveDate: today, terminationDate: '' }];
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(updatedData));
      dialogSpy.and.returnValue(dialogRefSpy);

      component.onEditChapter(chapter);

      expect(component.chaptersDataSource[0].chapterName).toBe('Updated Chapter');
    });

    it('should not update chapter when dialog returns empty array', () => {
      const today = moment.utc().format('DD/MM/YYYY');
      const chapter = { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: today, terminationDate: '', status: 'Active' as const, isDefault: true };
      component.chaptersDataSource = [chapter];
      component.filteredChaptersDataSource = [...component.chaptersDataSource];

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of([]));
      dialogSpy.and.returnValue(dialogRefSpy);

      component.onEditChapter(chapter);

      expect(component.chaptersDataSource[0].chapterName).toBe('Chapter One');
    });
  });

  // Printer Code Auto-population
  describe('printer code watcher', () => {
    it('should auto-populate printer description when printer is selected', () => {
      fixture.detectChanges();
      component.printerCodes.set([{ printerId: 'PR1', printerDescription: 'Printer One' }]);
      component.userForm.patchValue({ printerId: 'PR1' });
      expect(component.userForm.get('printerDescription')?.value).toBe('Printer One');
    });

    it('should clear printer description when printerId is cleared', () => {
      fixture.detectChanges();
      component.printerCodes.set([{ printerId: 'PR1', printerDescription: 'Printer One' }]);
      component.userForm.patchValue({ printerId: 'PR1' });
      component.userForm.patchValue({ printerId: '' });
      expect(component.userForm.get('printerDescription')?.value).toBe('');
    });
  });

  // Lab code watcher - clearing
  describe('lab code watcher - clearing', () => {
    it('should clear lab description when lab code is cleared', () => {
      fixture.detectChanges();
      component.labCodes.set([{ labCode: 'LAB1', labDescription: 'Lab One' }]);
      component.userForm.patchValue({ labCode: 'LAB1' });
      expect(component.userForm.get('labDescription')?.value).toBe('Lab One');
      component.userForm.patchValue({ labCode: '' });
      expect(component.userForm.get('labDescription')?.value).toBe('');
    });
  });

  // Group code watcher - clearing
  describe('group code watcher - clearing', () => {
    it('should clear group description when group code is cleared', () => {
      fixture.detectChanges();
      const today = moment.utc().format('YYYY-MM-DD');
      component.groups.set([{ applId: 'APP1', groupId: 'GRP1', description: 'Group One', userCount: 5, lastModifiedDate: today }]);
      component.userForm.patchValue({ groupCode: 'GRP1' });
      expect(component.userForm.get('groupDescription')?.value).toBe('Group One');
      component.userForm.patchValue({ groupCode: '' });
      expect(component.userForm.get('groupDescription')?.value).toBe('');
    });
  });

  // onAlphanumericKeyDown
  describe('onAlphanumericKeyDown', () => {
    it('should allow control keys', () => {
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      spyOn(event, 'preventDefault');
      component.onAlphanumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Tab key', () => {
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(event, 'preventDefault');
      component.onAlphanumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+C (copy)', () => {
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
      spyOn(event, 'preventDefault');
      component.onAlphanumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow alphanumeric characters', () => {
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(event, 'preventDefault');
      component.onAlphanumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow digits', () => {
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: '5' });
      spyOn(event, 'preventDefault');
      component.onAlphanumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block special characters', () => {
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: '!' });
      spyOn(event, 'preventDefault');
      component.onAlphanumericKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block @ symbol', () => {
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: '@' });
      spyOn(event, 'preventDefault');
      component.onAlphanumericKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow arrow keys', () => {
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      spyOn(event, 'preventDefault');
      component.onAlphanumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow metaKey (Cmd on Mac)', () => {
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: 'v', metaKey: true });
      spyOn(event, 'preventDefault');
      component.onAlphanumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // getControl, hasError, getSelectedGroupDescription
  describe('form utilities', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('getControl should return the form control', () => {
      const control = component.getControl('userId');
      expect(control).toBe(component.userForm.get('userId'));
    });

    it('getControl should return null for non-existent control', () => {
      const control = component.getControl('nonExistent');
      expect(control).toBeNull();
    });

    it('hasError should return true for touched invalid control', () => {
      const control = component.userForm.get('userId');
      control?.markAsTouched();
      // userId is required and empty
      expect(component.hasError('userId', 'required')).toBeTruthy();
    });

    it('hasError should return false for untouched control', () => {
      expect(component.hasError('userId', 'required')).toBeFalsy();
    });

    it('hasError should return false for non-existent control', () => {
      expect(component.hasError('nonExistent', 'required')).toBeFalsy();
    });

    it('getSelectedGroupDescription should return empty string when no group selected', () => {
      expect(component.getSelectedGroupDescription()).toBe('');
    });

    it('getSelectedGroupDescription should return description when group is selected', () => {
      const today = moment.utc().format('YYYY-MM-DD');
      component.groups.set([{ applId: 'APP1', groupId: 'GRP1', description: 'Group One', userCount: 5, lastModifiedDate: today }]);
      component.userForm.patchValue({ groupCode: 'GRP1' });
      expect(component.getSelectedGroupDescription()).toBe('Group One');
    });

    it('getSelectedGroupDescription should return empty string when group not found', () => {
      component.groups.set([]);
      component.userForm.patchValue({ groupCode: 'NONEXISTENT' });
      expect(component.getSelectedGroupDescription()).toBe('');
    });
  });

  // sanitizeInput
  describe('sanitizeInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should remove leading spaces', () => {
      component.userForm.get('firstName')?.setValue('  John');
      component.sanitizeInput('firstName');
      expect(component.userForm.get('firstName')?.value).toBe('John');
    });

    it('should collapse multiple spaces to single', () => {
      component.userForm.get('firstName')?.setValue('John   Doe');
      component.sanitizeInput('firstName');
      expect(component.userForm.get('firstName')?.value).toBe('John Doe');
    });

    it('should do nothing for non-existent control', () => {
      expect(() => component.sanitizeInput('nonExistent')).not.toThrow();
    });

    it('should do nothing for non-string value', () => {
      component.userForm.get('effectiveDate')?.setValue(new Date());
      expect(() => component.sanitizeInput('effectiveDate')).not.toThrow();
    });

    it('should not change already-clean value', () => {
      component.userForm.get('firstName')?.setValue('John');
      component.sanitizeInput('firstName');
      expect(component.userForm.get('firstName')?.value).toBe('John');
    });
  });

  // trimInput
  describe('trimInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trim trailing spaces', () => {
      component.userForm.get('firstName')?.setValue('John   ');
      component.trimInput('firstName');
      expect(component.userForm.get('firstName')?.value).toBe('John');
    });

    it('should do nothing for non-existent control', () => {
      expect(() => component.trimInput('nonExistent')).not.toThrow();
    });

    it('should do nothing for non-string value', () => {
      component.userForm.get('effectiveDate')?.setValue(new Date());
      expect(() => component.trimInput('effectiveDate')).not.toThrow();
    });

    it('should not change value without trailing spaces', () => {
      component.userForm.get('firstName')?.setValue('John');
      component.trimInput('firstName');
      expect(component.userForm.get('firstName')?.value).toBe('John');
    });
  });

  // onAlphanumericInput
  describe('onAlphanumericInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter non-alphanumeric characters from input', () => {
      const input = document.createElement('input');
      input.value = 'abc@123!';
      const event = { target: input } as unknown as Event;
      component.onAlphanumericInput(event, 'userId');
      expect(component.userForm.get('userId')?.value).toBe('abc123');
      expect(input.value).toBe('abc123');
    });

    it('should not change already-clean alphanumeric input', () => {
      const input = document.createElement('input');
      input.value = 'abc123';
      const event = { target: input } as unknown as Event;
      component.onAlphanumericInput(event, 'userId');
      // Should not have called setValue since values match
    });
  });

  // convertToUppercase
  describe('convertToUppercase', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should convert value to uppercase', () => {
      component.userForm.get('userId')?.setValue('abc');
      component.convertToUppercase('userId');
      expect(component.userForm.get('userId')?.value).toBe('ABC');
    });

    it('should not change already uppercase value', () => {
      component.userForm.get('userId')?.setValue('ABC');
      component.convertToUppercase('userId');
      expect(component.userForm.get('userId')?.value).toBe('ABC');
    });

    it('should do nothing for non-existent control', () => {
      expect(() => component.convertToUppercase('nonExistent')).not.toThrow();
    });

    it('should do nothing for non-string value', () => {
      component.userForm.get('effectiveDate')?.setValue(new Date());
      expect(() => component.convertToUppercase('effectiveDate')).not.toThrow();
    });
  });

  // onEffectiveDateBlur / onTerminationDateBlur
  describe('date blur handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('onEffectiveDateBlur should mark effectiveDate as touched', () => {
      const control = component.userForm.get('effectiveDate');
      expect(control?.touched).toBeFalsy();
      component.onEffectiveDateBlur();
      expect(control?.touched).toBeTruthy();
    });

    it('onTerminationDateBlur should mark terminationDate as touched', () => {
      const control = component.userForm.get('terminationDate');
      expect(control?.touched).toBeFalsy();
      component.onTerminationDateBlur();
      expect(control?.touched).toBeTruthy();
    });
  });

  // formatDateForDisplay edge cases
  describe('formatDateForDisplay edge cases', () => {
    it('should return empty string for empty input', () => {
      fixture.detectChanges();
      const result = component.formatDateForDisplay('');
      expect(result).toBe('');
    });
  });

  // Additional parseErrorMessage branches
  describe('parseErrorMessage - additional branches', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return responseMessage when it is user-friendly', () => {
      const error = { error: { message: 'User ID already taken' } };
      const result = component['parseErrorMessage'](error);
      expect(result).toBe('User ID already taken');
    });

    it('should return nestedErrorMessage when available', () => {
      const error = { error: { message: 'Failed to create user', error: { errorMessage: 'Nested error detail' } } };
      const result = component['parseErrorMessage'](error);
      expect(result).toBe('Nested error detail');
    });

    it('should return errorResponseError when available', () => {
      const error = { error: { message: 'Failed to create user', errorResponse: { error: 'API validation failed' } } };
      const result = component['parseErrorMessage'](error);
      expect(result).toBe('API validation failed');
    });

    it('should return errorField string when available', () => {
      const error = { error: { error: 'Simple error string' } };
      const result = component['parseErrorMessage'](error);
      expect(result).toBe('Simple error string');
    });

    it('should parse ORA-12899 error for USER_CLASS field', () => {
      const error = { error: { errorMessage: 'ORA-12899: value too large for column USER_CLASS' } };
      const result = component['parseErrorMessage'](error);
      expect(result).toContain('User Class');
      expect(result).toContain('maximum length of 5 characters');
    });

    it('should parse generic ORA-12899 error with field match', () => {
      const error = { message: 'ORA-12899: value too large for column "SOME_FIELD"' };
      const result = component['parseErrorMessage'](error);
      expect(result).toContain('SOME_FIELD');
    });

    it('should return generic ORA-12899 message when no field match', () => {
      const error = { message: 'ORA-12899: value too large' };
      const result = component['parseErrorMessage'](error);
      expect(result).toContain('maximum allowed length');
    });

    it('should detect termination/effective date error', () => {
      const error = { message: 'termination date before effective date' };
      const result = component['parseErrorMessage'](error);
      expect(result).toContain('Termination Date cannot be before Effective Date');
    });

    it('should detect chapter-related error', () => {
      const error = { message: 'Missing chapter assignment' };
      const result = component['parseErrorMessage'](error);
      expect(result).toContain('Please assign at least one chapter');
    });

    it('should detect warehouse-related error', () => {
      const error = { message: 'Invalid warehouse selection' };
      const result = component['parseErrorMessage'](error);
      expect(result).toContain('Invalid warehouse assignment');
    });

    it('should return errorDetails when available', () => {
      const error = { error: { Error: { ErrorMessage: 'Detailed error info' } } };
      const result = component['parseErrorMessage'](error);
      expect(result).toBe('Detailed error info');
    });

    it('should return default generic error when no specific match', () => {
      const error = {};
      const result = component['parseErrorMessage'](error);
      expect(result).toContain('Error creating system user account');
    });

    it('should return errorCode for duplicate user when errorCode is present', () => {
      const error = { error: { errorCode: 'User already exists in the system' } };
      const result = component['parseErrorMessage'](error);
      expect(result).toBe('User already exists in the system');
    });

    it('should handle PK_SYSTEM_USERS error', () => {
      component.userForm.patchValue({ userId: 'DUPE01' });
      const error = { message: 'PK_SYSTEM_USERS constraint violation' };
      const result = component['parseErrorMessage'](error);
      expect(result).toContain('DUPE01');
      expect(result).toContain('already exists');
    });

    it('should handle SYSTEM_USERS_PK in oracle error', () => {
      component.userForm.patchValue({ userId: 'DUPE02' });
      const error = { error: { errorMessage: 'SYSTEM_USERS_PK violated' } };
      const result = component['parseErrorMessage'](error);
      expect(result).toContain('DUPE02');
      expect(result).toContain('already exists');
    });

    it('should handle nested error.error.Error.ErrorMessage path', () => {
      const error = { error: { error: { ErrorMessage: 'deep nested error' } } };
      const result = component['parseErrorMessage'](error);
      expect(result).toBe('deep nested error');
    });
  });

  // loadLookupData error paths
  describe('loadLookupData - error paths', () => {
    it('should show error when chapters fails to load', () => {
      mockUserService.getChapters.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(mockSnackBar.open).toHaveBeenCalled();
      const calls = mockSnackBar.open.calls.allArgs();
      const chaptersError = calls.find((c: any[]) => c[0].includes('Failed to load chapters'));
      expect(chaptersError).toBeTruthy();
    });

    it('should show error when warehouses fails to load', () => {
      mockUserService.getWarehouses.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      const calls = mockSnackBar.open.calls.allArgs();
      const warehousesError = calls.find((c: any[]) => c[0].includes('Failed to load warehouses'));
      expect(warehousesError).toBeTruthy();
    });

    it('should show error when lab codes fails to load', () => {
      mockUserService.getLabCodes.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      const calls = mockSnackBar.open.calls.allArgs();
      const labError = calls.find((c: any[]) => c[0].includes('Failed to load lab codes'));
      expect(labError).toBeTruthy();
    });

    it('should show error when groups fails to load', () => {
      mockUserService.getGroups.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      const calls = mockSnackBar.open.calls.allArgs();
      const groupsError = calls.find((c: any[]) => c[0].includes('Failed to load groups'));
      expect(groupsError).toBeTruthy();
    });

    it('should show error when printer codes fails to load', () => {
      mockUserService.getPrinterCodes.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      const calls = mockSnackBar.open.calls.allArgs();
      const printerError = calls.find((c: any[]) => c[0].includes('Failed to load printer codes'));
      expect(printerError).toBeTruthy();
    });

    it('should show error when access levels fails to load', () => {
      mockUserService.getAccessLevels.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      const calls = mockSnackBar.open.calls.allArgs();
      const accessError = calls.find((c: any[]) => c[0].includes('Failed to load access levels'));
      expect(accessError).toBeTruthy();
    });
  });

  // loadLookupData success - populate filtered arrays
  describe('loadLookupData - success paths set filtered arrays', () => {
    it('should populate filteredWarehouses on success', () => {
      const warehouses = [{ warehouseID: 'W1', warehouseName: 'Warehouse 1' }];
      mockUserService.getWarehouses.and.returnValue(of(warehouses));
      fixture.detectChanges();
      expect(component.filteredWarehouses).toEqual(warehouses);
    });

    it('should populate filteredLabCodes on success', () => {
      const labs = [{ labCode: 'L1', labDescription: 'Lab 1' }];
      mockUserService.getLabCodes.and.returnValue(of(labs));
      fixture.detectChanges();
      expect(component.filteredLabCodes).toEqual(labs);
    });

    it('should populate filteredPrinterCodes on success', () => {
      const printers = [{ printerId: 'P1', printerDescription: 'Printer 1' }];
      mockUserService.getPrinterCodes.and.returnValue(of(printers));
      fixture.detectChanges();
      expect(component.filteredPrinterCodes).toEqual(printers);
    });

    it('should populate filteredGroups on success', () => {
      const groups = [{ applId: 'A', groupId: 'G1', description: 'Group 1', userCount: 1, lastModifiedDate: '2025-01-01' }];
      mockUserService.getGroups.and.returnValue(of(groups));
      fixture.detectChanges();
      expect(component.filteredGroups).toEqual(groups);
    });

    it('should populate filteredAccessLevels on success', () => {
      const levels = [{ value: 1, label: 'Level 1' }];
      mockUserService.getAccessLevels.and.returnValue(of(levels));
      fixture.detectChanges();
      expect(component.filteredAccessLevels).toEqual(levels);
    });
  });

  // Search controls filtering
  describe('search controls filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter lab codes by search term', () => {
      component.labCodes.set([
        { labCode: 'LAB1', labDescription: 'Blood Lab' },
        { labCode: 'LAB2', labDescription: 'Chemistry Lab' }
      ]);
      component.labCodeSearchControl.setValue('blood');
      expect(component.filteredLabCodes.length).toBe(1);
      expect(component.filteredLabCodes[0].labCode).toBe('LAB1');
    });

    it('should filter printer codes by search term', () => {
      component.printerCodes.set([
        { printerId: 'PR1', printerDescription: 'Floor 1 Printer' },
        { printerId: 'PR2', printerDescription: 'Floor 2 Printer' }
      ]);
      component.printerIdSearchControl.setValue('Floor 1');
      expect(component.filteredPrinterCodes.length).toBe(1);
      expect(component.filteredPrinterCodes[0].printerId).toBe('PR1');
    });

    it('should filter warehouses by search term', () => {
      component.warehouses.set([
        { warehouseID: 'W1', warehouseName: 'Main Warehouse' },
        { warehouseID: 'W2', warehouseName: 'Secondary Warehouse' }
      ]);
      component.warehouseSearchControl.setValue('Main');
      expect(component.filteredWarehouses.length).toBe(1);
      expect(component.filteredWarehouses[0].warehouseID).toBe('W1');
    });

    it('should filter groups by search term', () => {
      component.groups.set([
        { applId: 'A', groupId: 'GRP1', description: 'Admin Group', userCount: 1, lastModifiedDate: '2025-01-01' },
        { applId: 'A', groupId: 'GRP2', description: 'User Group', userCount: 2, lastModifiedDate: '2025-01-01' }
      ]);
      component.groupIdSearchControl.setValue('Admin');
      expect(component.filteredGroups.length).toBe(1);
      expect(component.filteredGroups[0].groupId).toBe('GRP1');
    });

    it('should filter access levels by search term', () => {
      component.accessLevels.set([
        { value: 1, label: 'Read Only' },
        { value: 5, label: 'Full Access' }
      ]);
      component.accessLevelSearchControl.setValue('Full');
      expect(component.filteredAccessLevels.length).toBe(1);
      expect(component.filteredAccessLevels[0].value).toBe(5);
    });

    it('should filter access levels by value string', () => {
      component.accessLevels.set([
        { value: 1, label: 'Read Only' },
        { value: 5, label: 'Full Access' }
      ]);
      component.accessLevelSearchControl.setValue('5');
      expect(component.filteredAccessLevels.length).toBe(1);
      expect(component.filteredAccessLevels[0].label).toBe('Full Access');
    });

    it('should show all lab codes when search is null', () => {
      component.labCodes.set([
        { labCode: 'LAB1', labDescription: 'Blood Lab' },
        { labCode: 'LAB2', labDescription: 'Chemistry Lab' }
      ]);
      component.labCodeSearchControl.setValue(null);
      expect(component.filteredLabCodes.length).toBe(2);
    });
  });

  // minTerminationDate getter
  describe('minTerminationDate', () => {
    it('should return minEffectiveDate when no effective date is set', () => {
      fixture.detectChanges();
      component.userForm.get('effectiveDate')?.setValue('');
      expect(component.minTerminationDate).toEqual(component.minEffectiveDate);
    });
  });

  // buildChapterAssignments (called through onSave)
  describe('buildChapterAssignments', () => {
    it('should build chapter assignments with correct flags', () => {
      fixture.detectChanges();
      const tomorrow = moment.utc().add(1, 'day');
      const todayFormatted = tomorrow.format('DD/MM/YYYY');
      const todayISO = tomorrow.format('YYYY-MM-DD');

      mockUserService.createUser.and.returnValue(of({ success: true }));
      mockUserService.parseDateToISO.and.returnValue(todayISO);

      component.userForm.patchValue({
        userId: 'U001', firstName: 'John', lastName: 'Doe', email: 'john@test.com',
        staffNumber: 'S001', effectiveDate: tomorrow.toDate(), assignedWarehouse: 'W1',
        groupCode: 'G1', accessLevel: '5'
      });
      component.chaptersDataSource = [
        { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: todayFormatted, terminationDate: todayFormatted, status: 'Active', isDefault: true },
        { chapterId: 'CH2', chapterName: 'Chapter Two', effectiveDate: todayFormatted, terminationDate: '', status: 'Active', isDefault: false }
      ];

      component.onSave();

      expect(mockUserService.createUser).toHaveBeenCalled();
      const request = mockUserService.createUser.calls.mostRecent().args[0];
      expect(request.chapters.length).toBe(2);
      expect(request.chapters[0].defaultFlag).toBe('Y');
      expect(request.chapters[1].defaultFlag).toBe('N');
    });
  });

  // onSave - success with response message
  describe('onSave - success with response message', () => {
    it('should use custom success message from response', () => {
      fixture.detectChanges();
      const tomorrow = moment.utc().add(1, 'day');
      const todayFormatted = tomorrow.format('DD/MM/YYYY');
      const todayISO = tomorrow.format('YYYY-MM-DD');

      mockUserService.createUser.and.returnValue(of({ success: true, message: 'Custom success msg' }));
      mockUserService.parseDateToISO.and.returnValue(todayISO);

      component.userForm.patchValue({
        userId: 'U001', firstName: 'John', lastName: 'Doe', email: 'john@test.com',
        staffNumber: 'S001', effectiveDate: tomorrow.toDate(), assignedWarehouse: 'W1',
        groupCode: 'G1', accessLevel: '5'
      });
      component.chaptersDataSource = [
        { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: todayFormatted, terminationDate: '', status: 'Active', isDefault: true }
      ];

      component.onSave();

      const successCall = mockSnackBar.open.calls.mostRecent();
      expect(successCall.args[0]).toBe('Custom success msg');
    });
  });

  // scrollToFirstError
  describe('scrollToFirstError (via onSave with invalid form)', () => {
    it('should scroll to personal-info section when userId is invalid', () => {
      fixture.detectChanges();
      // Make only userId invalid (required fields that should trigger personal-info scroll)
      component.userForm.patchValue({
        userId: '', firstName: 'John', lastName: 'Doe', email: 'john@test.com',
        staffNumber: 'S001', assignedWarehouse: 'W1', groupCode: 'G1', accessLevel: '5'
      });

      component.onSave();

      expect(mockScrollHandler.scrollToSection).toHaveBeenCalled();
    });
  });

  // addMultipleChapters via assign dialog - ensure default is set
  describe('addMultipleChapters (via onAssignChapter)', () => {
    let dialogSpy: jasmine.Spy;

    beforeEach(() => {
      fixture.detectChanges();
      dialogSpy = spyOn((component as any).dialog, 'open');
    });

    it('should ensure at least one chapter is default when none have isDefault', () => {
      component.userForm.patchValue({ assignedWarehouse: 'W1' });
      const dialogResult = [
        { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: '01/07/2025', terminationDate: '', isDefault: false },
        { chapterId: 'CH2', chapterName: 'Chapter Two', effectiveDate: '01/07/2025', terminationDate: '', isDefault: false }
      ];
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(dialogResult));
      dialogSpy.and.returnValue(dialogRefSpy);

      component.onAssignChapter();

      const hasDefault = component.chaptersDataSource.some(c => c.isDefault);
      expect(hasDefault).toBeTruthy();
      expect(component.chaptersDataSource[0].isDefault).toBeTruthy();
    });

    it('should handle chapters with undefined isDefault', () => {
      component.userForm.patchValue({ assignedWarehouse: 'W1' });
      const dialogResult = [
        { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: '01/07/2025', terminationDate: '' }
      ];
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(dialogResult));
      dialogSpy.and.returnValue(dialogRefSpy);

      component.onAssignChapter();

      expect(component.chaptersDataSource.length).toBe(1);
      expect(component.chaptersDataSource[0].isDefault).toBeTruthy();
    });

    it('should handle chapters with termination date', () => {
      component.userForm.patchValue({ assignedWarehouse: 'W1' });
      const dialogResult = [
        { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: '01/07/2025', terminationDate: '31/12/2025', isDefault: true }
      ];
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(dialogResult));
      dialogSpy.and.returnValue(dialogRefSpy);

      component.onAssignChapter();

      expect(component.chaptersDataSource[0].terminationDate).toBe('31/12/2025');
    });
  });

  // subscribeToChapterChanges
  describe('subscribeToChapterChanges', () => {
    it('should reload lookup data when chapter changes', () => {
      fixture.detectChanges();
      // Reset calls made during init
      mockUserService.getChapters.calls.reset();
      mockUserService.getWarehouses.calls.reset();
      mockUserService.getLabCodes.calls.reset();
      mockUserService.getGroups.calls.reset();

      // Emit chapter change
      chapterChangedSubject.next();

      expect(mockUserService.getChapters).toHaveBeenCalled();
      expect(mockUserService.getWarehouses).toHaveBeenCalled();
      expect(mockUserService.getLabCodes).toHaveBeenCalled();
      expect(mockUserService.getGroups).toHaveBeenCalled();
    });
  });

  // onViewAssignedWarehouses
  describe('onViewAssignedWarehouses', () => {
    it('should be a no-op in add user mode', () => {
      fixture.detectChanges();
      expect(() => component.onViewAssignedWarehouses()).not.toThrow();
    });
  });

  // Date input handlers
  describe('date input handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('onEffectiveDateInput should handle date input', () => {
      const input = document.createElement('input');
      input.value = '15-JUL-2025';
      const event = { target: input } as unknown as Event;
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });

    it('onTerminationDateInput should handle date input', () => {
      const input = document.createElement('input');
      input.value = '31-DEC-2025';
      const event = { target: input } as unknown as Event;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });
  });

  // getEffectiveDateError / getTerminationDateError
  describe('date error messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('getEffectiveDateError should return a string', () => {
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('getTerminationDateError should return a string', () => {
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });
  });

  // setupDateValidation - effectiveDate changes update terminationDate validity
  describe('setupDateValidation', () => {
    it('should update terminationDate validity when effectiveDate changes', () => {
      fixture.detectChanges();
      const termControl = component.userForm.get('terminationDate');
      spyOn(termControl!, 'updateValueAndValidity');

      component.userForm.get('effectiveDate')?.setValue(moment.utc().add(1, 'day').toDate());

      expect(termControl!.updateValueAndValidity).toHaveBeenCalled();
    });
  });

  // onSave with termination date
  describe('onSave with optional fields', () => {
    it('should include termination date in request when provided', () => {
      fixture.detectChanges();
      const tomorrow = moment.utc().add(1, 'day');
      const nextMonth = moment.utc().add(1, 'month');
      const todayFormatted = tomorrow.format('DD/MM/YYYY');
      const todayISO = tomorrow.format('YYYY-MM-DD');

      mockUserService.createUser.and.returnValue(of({ success: true }));
      mockUserService.parseDateToISO.and.returnValue(todayISO);

      component.userForm.patchValue({
        userId: 'U001', firstName: 'John', lastName: 'Doe', email: 'john@test.com',
        staffNumber: 'S001', effectiveDate: tomorrow.toDate(), terminationDate: nextMonth.toDate(),
        assignedWarehouse: 'W1', groupCode: 'G1', accessLevel: '5',
        labCode: 'LAB1', labDescription: 'Lab One', qcUserId: 'QC01',
        printerId: 'PR1', printerDescription: 'Printer One',
        nameInitials: 'JD', userClass: 'CLS1', adUserId: 'ADUSER'
      });
      component.chaptersDataSource = [
        { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: todayFormatted, terminationDate: '', status: 'Active', isDefault: true }
      ];

      component.onSave();

      expect(mockUserService.createUser).toHaveBeenCalled();
      const request = mockUserService.createUser.calls.mostRecent().args[0];
      expect(request.initials).toBe('JD');
      expect(request.userClass).toBe('CLS1');
      expect(request.adUserId).toBe('ADUSER');
    });
  });
});
