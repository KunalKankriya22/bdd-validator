import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { of, throwError } from 'rxjs';
import { ViewAttachedUsersPanelComponent } from './view-attached-users-panel';
import { LabUserAccessService } from '../services/lab-user-access.service';
import { AttachedUser } from '../models/lab-user-access.model';

describe('ViewAttachedUsersPanelComponent', () => {
  let labUserAccessServiceSpy: any;
  let component: ViewAttachedUsersPanelComponent;
  let fixture: ComponentFixture<ViewAttachedUsersPanelComponent>;
  let mockLabUserAccessService: jasmine.SpyObj<LabUserAccessService>;

  const mockAttachedUsers: AttachedUser[] = [
    { userId: 'USER001', name: 'User One', level: 5 },
    { userId: 'USER002', name: 'User Two', level: 3 },
    { userId: 'USER003', name: 'User Three', level: 2 }
  ];

  beforeEach(() => {

    labUserAccessServiceSpy = jasmine.createSpyObj('LabUserAccessService', ['getAttachedUsers']);



      TestBed.configureTestingModule({
      imports: [ViewAttachedUsersPanelComponent, MatIconModule, MatButtonModule],
      providers: [{ provide: LabUserAccessService, useValue: labUserAccessServiceSpy }]
    });


    


      labUserAccessServiceSpy.getAttachedUsers.calls.reset();


    mockLabUserAccessService = TestBed.inject(LabUserAccessService) as jasmine.SpyObj<LabUserAccessService>;
    fixture = TestBed.createComponent(ViewAttachedUsersPanelComponent);
    component = fixture.componentInstance;


    });


  describe('ngOnChanges', () => {
    it('should load attached users when panel opens', () => {
      mockLabUserAccessService.getAttachedUsers.and.returnValue(of(mockAttachedUsers));
      component.accessClass = 'LAB01';

      component.isOpen = true; // Set to new value before ngOnChanges
      component.ngOnChanges({
        isOpen: new SimpleChange(false, true, false)
      });

      expect(mockLabUserAccessService.getAttachedUsers).toHaveBeenCalledWith('LAB01');
      expect(component.attachedUsers).toEqual(mockAttachedUsers);
    });

    it('should load attached users when access class changes and panel is open', () => {
      mockLabUserAccessService.getAttachedUsers.and.returnValue(of(mockAttachedUsers));
      component.isOpen = true;
      component.accessClass = 'LAB01';

      component.ngOnChanges({
        accessClass: new SimpleChange('LAB00', 'LAB01', false)
      });

      expect(mockLabUserAccessService.getAttachedUsers).toHaveBeenCalledWith('LAB01');
      expect(component.attachedUsers).toEqual(mockAttachedUsers);
    });




  });

  describe('loadAttachedUsers', () => {
    it('should load attached users successfully', () => {
      mockLabUserAccessService.getAttachedUsers.and.returnValue(of(mockAttachedUsers));
      component.accessClass = 'LAB01';

      component.isOpen = true;
      component.ngOnChanges({
        isOpen: new SimpleChange(false, true, false)
      });

      expect(component.attachedUsers.length).toBe(3);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
    });

    it('should handle error when loading attached users', () => {
      const errorResponse = { error: { message: 'Failed to load users' } };
      mockLabUserAccessService.getAttachedUsers.and.returnValue(throwError(() => errorResponse));
      component.accessClass = 'LAB01';

      component.isOpen = true;
      component.ngOnChanges({
        isOpen: new SimpleChange(false, true, false)
      });

      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toBe('Failed to load users');
      expect(component.isLoading).toBe(false);
    });






  });
  describe('Component State', () => {


    it('should display empty state when no users attached', () => {
      mockLabUserAccessService.getAttachedUsers.and.returnValue(of([]));
      component.accessClass = 'LAB01';

      component.isOpen = true;
      component.ngOnChanges({
        isOpen: new SimpleChange(false, true, false)
      });

      expect(component.attachedUsers.length).toBe(0);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      component.originalUsers = [...mockAttachedUsers];
      component.attachedUsers = [...mockAttachedUsers];
    });

    it('should default to ascending sort', () => {
      expect(component.sortDirection).toBe('asc');
    });



    it('should toggle between asc and desc on repeated clicks', () => {
      component.onSort('userId'); // First click - desc (from default asc)
      expect(component.sortDirection).toBe('desc');
      expect(component.sortColumn).toBe('userId');

      component.onSort('userId'); // Second click - back to asc
      expect(component.sortDirection).toBe('asc');
      expect(component.sortColumn).toBe('userId');
      expect(component.attachedUsers[0].userId).toBe('USER001');
    });
  });
});
