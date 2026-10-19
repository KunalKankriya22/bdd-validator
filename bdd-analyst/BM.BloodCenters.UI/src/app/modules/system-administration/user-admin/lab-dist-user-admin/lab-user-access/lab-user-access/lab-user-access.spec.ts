import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LabUserAccessComponent } from './lab-user-access';
import { LabUserAccessService } from '../services/lab-user-access.service';
import { AccessClass, LabUserAccessDetailsResponse } from '../models/lab-user-access.model';

describe('LabUserAccessComponent', () => {
  let labUserAccessServiceSpy: any;
  let component: LabUserAccessComponent;
  let fixture: ComponentFixture<LabUserAccessComponent>;
  let mockLabUserAccessService: jasmine.SpyObj<LabUserAccessService>;

  const mockAccessClasses: LabUserAccessDetailsResponse = {
    userName: 'Test User',
    department: 'Lab Services',
    data: [
      {
        accessClass: 'LAB01',
        code: 'LAB01',
        description: 'Lab Access 1',
        accessLevel: 5,
        effectiveDate: '2024-01-01',
        terminationDate: null
      },
      {
        accessClass: 'LAB02',
        code: 'LAB02',
        description: 'Lab Access 2',
        accessLevel: 3,
        effectiveDate: '2024-01-15',
        terminationDate: '2024-12-31'
      }
    ]
  };

  beforeEach(() => {

    labUserAccessServiceSpy = jasmine.createSpyObj('LabUserAccessService', [
      'getLabUserAccessDetails',
      'getAccessClassOptions',
      'addUserAccessClass',
      'updateUserAccessClass',
      'getAttachedUsers',
      'getUsersDropdown'
    ]);
    labUserAccessServiceSpy.getUsersDropdown.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [
        LabUserAccessComponent,
        ReactiveFormsModule,
        MatDialogModule,
        MatSnackBarModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: LabUserAccessService, useValue: labUserAccessServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    });


    


      labUserAccessServiceSpy.getLabUserAccessDetails.calls.reset();


      labUserAccessServiceSpy.getAccessClassOptions.calls.reset();


      labUserAccessServiceSpy.addUserAccessClass.calls.reset();


      labUserAccessServiceSpy.updateUserAccessClass.calls.reset();


      labUserAccessServiceSpy.getAttachedUsers.calls.reset();


      labUserAccessServiceSpy.getUsersDropdown.calls.reset();


      labUserAccessServiceSpy.getUsersDropdown.and.returnValue(of([]));


    mockLabUserAccessService = TestBed.inject(LabUserAccessService) as jasmine.SpyObj<LabUserAccessService>;
    fixture = TestBed.createComponent(LabUserAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Form Initialization', () => {
    it('should initialize form with userId field', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('userId')).toBeDefined();
    });


  });

  describe('onRetrieve', () => {
    it('should retrieve user access classes successfully', () => {
      mockLabUserAccessService.getLabUserAccessDetails.and.returnValue(of(mockAccessClasses));
      component.form.patchValue({ userId: 'TEST001' });

      component.onRetrieve();

      expect(mockLabUserAccessService.getLabUserAccessDetails).toHaveBeenCalledWith('TEST001');
      expect(component.userInfo?.userId).toBe('TEST001');
      expect(component.userInfo?.userName).toBe('Test User');
      expect(component.userInfo?.department).toBe('Lab Services');
      expect(component.accessClasses.length).toBe(2);
      expect(component.accessClasses[0].accessClass).toBe('LAB01');
      expect(component.filteredAccessClasses.length).toBe(2);
      expect(component.hasSearched).toBe(true);
      expect(component.isLoading).toBe(false);
    });





    it('should convert lowercase userId to uppercase when calling service', () => {
      mockLabUserAccessService.getLabUserAccessDetails.and.returnValue(of(mockAccessClasses));
      component.form.patchValue({ userId: 'test001' });

      component.onRetrieve();

      expect(mockLabUserAccessService.getLabUserAccessDetails).toHaveBeenCalledWith('TEST001');
    });

    it('should convert mixed case userId to uppercase when calling service', () => {
      mockLabUserAccessService.getLabUserAccessDetails.and.returnValue(of(mockAccessClasses));
      component.form.patchValue({ userId: 'TeSt001' });

      component.onRetrieve();

      expect(mockLabUserAccessService.getLabUserAccessDetails).toHaveBeenCalledWith('TEST001');
    });






  });

  describe('onClear', () => {
    beforeEach(() => {
      // Set up component with data
      component.form.patchValue({ userId: 'TEST001' });
      component.hasSearched = true;
      component.userInfo = { userId: 'TEST001', userName: 'TEST001', department: '' };
      component.accessClasses = [...mockAccessClasses.data];
      component.filteredAccessClasses = [...mockAccessClasses.data];
      component.hasError = true;
      component.errorMessage = 'Some error';
      component.showActionMenu = true;
      component.activeMenuIndex = 0;
    });

    it('should reset all component state', () => {
      component.onClear();

      expect(component.form.value.userId).toBe(null);
      expect(component.hasSearched).toBe(false);
      expect(component.userInfo).toBeNull();
      expect(component.accessClasses).toEqual([]);
      expect(component.filteredAccessClasses).toEqual([]);
      expect(component.hasError).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.showActionMenu).toBe(false);
      expect(component.activeMenuIndex).toBeNull();
    });
  });

  describe('onSort', () => {
    beforeEach(() => {
      component.accessClasses = [...mockAccessClasses.data];
      component.filteredAccessClasses = [...mockAccessClasses.data];
    });

    it('should sort ascending on first click', () => {
      component.onSort('accessClass');

      expect(component.sortColumn).toBe('accessClass');
      expect(component.sortDirection).toBe('asc');
      expect(component.filteredAccessClasses[0].accessClass).toBe('LAB01');
      expect(component.filteredAccessClasses[1].accessClass).toBe('LAB02');
    });

    it('should sort descending on second click', () => {
      component.sortColumn = 'accessClass';
      component.sortDirection = 'asc';

      component.onSort('accessClass');

      expect(component.sortDirection).toBe('desc');
      expect(component.filteredAccessClasses[0].accessClass).toBe('LAB02');
      expect(component.filteredAccessClasses[1].accessClass).toBe('LAB01');
    });

    it('should reset to default order on third click', () => {
      component.sortColumn = 'accessClass';
      component.sortDirection = 'desc';

      component.onSort('accessClass');

      expect(component.sortColumn).toBeNull();
      expect(component.sortDirection).toBeNull();
      expect(component.filteredAccessClasses.length).toBe(2);
      expect(component.filteredAccessClasses[0].accessClass).toBe('LAB01');
      expect(component.filteredAccessClasses[1].accessClass).toBe('LAB02');
    });
  });

  describe('Action Menu', () => {
    function createMockClickEvent(): Event {
      const btn = document.createElement('button');
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: btn });
      spyOn(event, 'stopPropagation');
      return event;
    }

    it('should toggle action menu visibility', () => {
      const event = createMockClickEvent();

      component.toggleActionMenu(0, event);

      expect(component.showActionMenu).toBe(true);
      expect(component.activeMenuIndex).toBe(0);
      expect(event.stopPropagation).toHaveBeenCalled();
    });






  });

  describe('Dialog and Panel Actions', () => {
    it('should open add access class panel', () => {
      component.userInfo = { userId: 'TEST001', userName: 'TEST001', department: '' };

      component.openAddAccessClass();

      expect(component.addEditPanelOpen).toBe(true);
      expect(component.addEditPanelMode).toBe('add');
      expect(component.addEditPanelData).toBeNull();
    });

    it('should open edit class panel with access class data', () => {
      const accessClass: AccessClass = mockAccessClasses.data[0];
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');

      component.openEditClass(accessClass, event);

      expect(component.addEditPanelOpen).toBe(true);
      expect(component.addEditPanelMode).toBe('edit');
      expect(component.addEditPanelData).toBe(accessClass);
      expect(component.showActionMenu).toBe(false);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should open view attached users panel', () => {
      const accessClass: AccessClass = mockAccessClasses.data[0];
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');

      component.openViewAttachedUsers(accessClass, event);

      expect(component.viewUsersPanelOpen).toBe(true);
      expect(component.viewUsersPanelAccessClass).toBe('LAB01');
      expect(component.viewUsersPanelDescription).toBe('Lab Access 1');
      expect(component.showActionMenu).toBe(false);
      expect(event.stopPropagation).toHaveBeenCalled();
    });


  });
  describe('Keyboard Shortcuts', () => {






    it('should not close side panel on other keys', () => {
      component.viewUsersPanelOpen = true;
      const event = new KeyboardEvent('keydown', { key: 'Enter' });

      component.handleKeyboardShortcut(event);

      expect(component.viewUsersPanelOpen).toBe(true);
    });
  });
});
