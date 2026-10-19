import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { EditUserComponent } from './edit-user';
import { UserApiService } from '../services/user.service';
import { ScrollHandlerService } from '../services/scroll-handler.service';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('EditUser Component', () => {
  let component: EditUserComponent;
  let fixture: ComponentFixture<EditUserComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockUserService: jasmine.SpyObj<UserApiService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockScrollHandler: jasmine.SpyObj<ScrollHandlerService>;

  let mockUserData: any;
  let mockGroupDetails: any;
  let mockChapters: any[];

  beforeEach(() => {
    const today = moment.utc();
    const futureDate = moment.utc().add(30, 'days');

    mockUserData = {
      userId: 'USR001',
      userFirstName: 'John',
      userLastName: 'Doe',
      userInitials: 'JD',
      userClass: 'ADM',
      userEmail: 'john@test.com',
      staffNo: '123',
      adUserId: 'JDOE',
      labCode: 'DN',
      ktUserId: 'QC1',
      printerId: 'PRN1',
      printerDescription: 'Printer One',
      warehouseId: 'W',
      effectiveDate: today.toISOString(),
      terminationDate: futureDate.toISOString(),
      lastModifiedDate: today.toISOString(),
      lastModifiedBy: 'Admin'
    };

    mockGroupDetails = {
      item: {
        userId: 'USR001',
        groupId: 'GRP01',
        groupDescription: 'Blood Center Support',
        accessLevel: 5
      }
    };

    mockChapters = [
      { chapterId: 'BA2', chapterName: 'Brooke Army', effectiveDate: today.toISOString(), terminationDate: null, defaultFlag: 'Y' }
    ];
  

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl', 'createUrlTree', 'serializeUrl'], {
      events: of({}),
      url: '/'
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');
    mockRouter.navigateByUrl.and.returnValue(Promise.resolve(true));

    mockActivatedRoute = {
      snapshot: { paramMap: { get: (key: string) => key === 'userId' ? 'USR001' : null } },
      params: of({ userId: 'USR001' }),
      queryParams: of({})
    };

    mockDialog = createMockMatDialog();
    mockUserService = jasmine.createSpyObj('UserApiService', [
      'getChapters', 'getWarehouses', 'getLabCodes', 'getPrinterCodes', 'getGroups', 'getAccessLevels',
      'getUser', 'getUserChapters', 'getUserGroupDetails',
      'updateUser', 'createUser', 'formatDateToISO', 'parseDateToISO'
    ]);
    mockSnackBar = createMockMatSnackBar();
    mockScrollHandler = jasmine.createSpyObj('ScrollHandlerService',
      ['initialize', 'cleanup', 'scrollToSection', 'getActiveSection']
    );

    mockScrollHandler.getActiveSection.and.returnValue(of('personal-info'));
    mockUserService.getChapters.and.returnValue(of([]));
    mockUserService.getWarehouses.and.returnValue(of([]));
    mockUserService.getLabCodes.and.returnValue(of([]));
    mockUserService.getPrinterCodes.and.returnValue(of([]));
    mockUserService.getGroups.and.returnValue(of([]));
    mockUserService.getAccessLevels.and.returnValue(of([]));
    mockUserService.getUser.and.returnValue(of(mockUserData as any));
    mockUserService.getUserChapters.and.returnValue(of(mockChapters as any));
    mockUserService.getUserGroupDetails.and.returnValue(of(mockGroupDetails as any));
    mockUserService.parseDateToISO.and.callFake((d: string) => d);



      TestBed.configureTestingModule({
      imports: [EditUserComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: MatDialog, useValue: mockDialog },
        { provide: UserApiService, useValue: mockUserService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: ScrollHandlerService, useValue: mockScrollHandler }
      ]
    })
    .overrideComponent(EditUserComponent, {
      add: { providers: [{ provide: ScrollHandlerService, useValue: mockScrollHandler }] }
    });


    


      mockRouter.navigate.calls.reset();


      mockRouter.navigateByUrl.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockUserService.getChapters.calls.reset();


      mockUserService.getWarehouses.calls.reset();


      mockUserService.getLabCodes.calls.reset();


      mockUserService.getPrinterCodes.calls.reset();


      mockUserService.getGroups.calls.reset();


      mockUserService.getAccessLevels.calls.reset();


      mockUserService.getUser.calls.reset();


      mockUserService.getUserChapters.calls.reset();


      mockUserService.getUserGroupDetails.calls.reset();


      mockUserService.updateUser.calls.reset();


      mockUserService.createUser.calls.reset();


      mockUserService.formatDateToISO.calls.reset();


      mockUserService.parseDateToISO.calls.reset();


      mockScrollHandler.initialize.calls.reset();


      mockScrollHandler.cleanup.calls.reset();


      mockScrollHandler.scrollToSection.calls.reset();


      mockScrollHandler.getActiveSection.calls.reset();


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockRouter.navigateByUrl.and.returnValue(Promise.resolve(true));


      mockScrollHandler.getActiveSection.and.returnValue(of('personal-info'));


      mockUserService.getChapters.and.returnValue(of([]));


      mockUserService.getWarehouses.and.returnValue(of([]));


      mockUserService.getLabCodes.and.returnValue(of([]));


      mockUserService.getPrinterCodes.and.returnValue(of([]));


      mockUserService.getGroups.and.returnValue(of([]));


      mockUserService.getAccessLevels.and.returnValue(of([]));


      mockUserService.getUser.and.returnValue(of(mockUserData as any));


      mockUserService.getUserChapters.and.returnValue(of(mockChapters as any));


      mockUserService.getUserGroupDetails.and.returnValue(of(mockGroupDetails as any));


      mockUserService.parseDateToISO.and.callFake((d: string) => d);


    fixture = TestBed.createComponent(EditUserComponent);
    component = fixture.componentInstance;


    });


  it('should have userId disabled in form', () => {
    fixture.detectChanges();
    expect(component.userForm.get('userId')?.disabled).toBeTruthy();
  });

  it('should load user data on init', () => {
    fixture.detectChanges();
    expect(mockUserService.getUser).toHaveBeenCalledWith('USR001');
    expect(mockUserService.getUserChapters).toHaveBeenCalledWith('USR001');
    expect(mockUserService.getUserGroupDetails).toHaveBeenCalledWith('USR001');
  });

  it('should populate form with user data', () => {
    fixture.detectChanges();
    expect(component.userForm.get('firstName')?.value).toBe('John');
    expect(component.userForm.get('lastName')?.value).toBe('Doe');
    expect(component.userForm.get('email')?.value).toBe('john@test.com');
  });





  it('should have required validators on key fields', () => {
    fixture.detectChanges();
    component.userForm.patchValue({ firstName: '', lastName: '', email: '' });
    expect(component.userForm.get('firstName')?.hasError('required')).toBeTruthy();
    expect(component.userForm.get('lastName')?.hasError('required')).toBeTruthy();
    expect(component.userForm.get('email')?.hasError('required')).toBeTruthy();
  });

  it('should auto-populate lab description when lab code is selected', () => {
    fixture.detectChanges();
    component.labCodes.set([{ labCode: 'LAB1', labDescription: 'Lab One' }]);
    component.userForm.patchValue({ labCode: 'LAB1' });
    expect(component.userForm.get('labDescription')?.value).toBe('Lab One');
  });

  it('should auto-populate printer description when printer code is selected', () => {
    fixture.detectChanges();
    component.printerCodes.set([{ printerId: 'PRN1', printerDescription: 'Printer One' }]);
    component.userForm.patchValue({ printerId: 'PRN1' });
    expect(component.userForm.get('printerDescription')?.value).toBe('Printer One');
  });

  it('should auto-populate group description when group code is selected', () => {
    fixture.detectChanges();
    const today = moment.utc().format('YYYY-MM-DD');
    component.groups.set([{ applId: 'APP1', groupId: 'GRP1', description: 'Group One', userCount: 5, lastModifiedDate: today }]);
    component.userForm.patchValue({ groupCode: 'GRP1' });
    expect(component.userForm.get('groupDescription')?.value).toBe('Group One');
  });



  it('should filter chapters based on search term', () => {
    fixture.detectChanges();
    const today = moment.utc().format('DD/MM/YYYY');
    component.chaptersDataSource = [
      { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: today, terminationDate: '', status: 'Active', isDefault: true },
      { chapterId: 'CH2', chapterName: 'Chapter Two', effectiveDate: today, terminationDate: '', status: 'Active', isDefault: false }
    ];
    component.chapterSearchTerm = 'One';
    component.onChapterSearch();
    expect(component.filteredChaptersDataSource.length).toBe(1);
  });

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





  it('should call updateUser on save with valid data', () => {
    fixture.detectChanges();
    const tomorrow = moment.utc().add(1, 'day');
    const nextMonth = moment.utc().add(30, 'days');
    const todayFormatted = moment.utc().format('DD/MM/YYYY');

    mockUserService.updateUser.and.returnValue(of({ success: true, message: 'Updated' } as any));
    component.userForm.patchValue({
      firstName: 'John', lastName: 'Doe', email: 'john@test.com',
      effectiveDate: tomorrow, terminationDate: nextMonth,
      assignedWarehouse: 'W1', groupCode: 'G1', accessLevel: '5'
    });
    component.chaptersDataSource = [
      { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: todayFormatted, terminationDate: '', status: 'Active', isDefault: true }
    ];
    component.onSave();
    expect(mockUserService.updateUser).toHaveBeenCalledWith('USR001', jasmine.any(Object));
  });



  it('should clear all fields except userId and effectiveDate on clear all', () => {
    fixture.detectChanges();
    const today = moment.utc().format('DD/MM/YYYY');
    const effectiveDateValue = '01-JAN-2026';
    component.userForm.patchValue({ firstName: 'John', effectiveDate: effectiveDateValue });
    component.chaptersDataSource = [
      { chapterId: 'CH1', chapterName: 'Chapter One', effectiveDate: today, terminationDate: '', status: 'Active', isDefault: true }
    ];
    component.onClearAll();
    expect(component.userForm.get('userId')?.value).toBe('USR001');
    expect(component.userForm.get('effectiveDate')?.value).toBe(effectiveDateValue);
    expect(component.userForm.get('firstName')?.value).toBeNull();
    expect(component.chaptersDataSource.length).toBe(0);
    expect(component.userForm.get('effectiveDate')?.disabled).toBe(true);
  });









  it('should handle gracefully when group details not found', () => {
    mockUserService.getUserGroupDetails.and.returnValue(of(null as any));
    fixture.detectChanges();
    expect(component.userForm.get('groupCode')?.value).toBeFalsy();
  });

  it('should handle gracefully when chapters not found', () => {
    mockUserService.getUserChapters.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component.chaptersDataSource.length).toBe(0);
  });


});
