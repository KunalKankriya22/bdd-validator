import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { EditGroupComponent } from './edit-group';
import { GroupService } from '../../services/group.service';
import { Group } from '../../models/group.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('EditGroupComponent', () => {
  let component: EditGroupComponent;
  let fixture: ComponentFixture<EditGroupComponent>;
  let groupServiceSpy: jasmine.SpyObj<GroupService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<EditGroupComponent>>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockGroup: Group = {
    applId: 'DON',
    groupId: 'ADM00',
    description: 'Delivers reliable assistance',
    userCount: 8
  };

  beforeEach(async () => {
    // Create spies for the dependencies
    const groupSpy = jasmine.createSpyObj('GroupService', ['updateGroup']);
    const dialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const snackSpy = createMockMatSnackBar();

    await TestBed.configureTestingModule({
      imports: [EditGroupComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: GroupService, useValue: groupSpy },
        { provide: MatDialogRef, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackSpy },
        { provide: MAT_DIALOG_DATA, useValue: { group: mockGroup } }
      ]
    })
    .overrideComponent(EditGroupComponent, {
      remove: { imports: [MatSnackBarModule] }
    })
    .compileComponents();

    groupServiceSpy = TestBed.inject(GroupService) as jasmine.SpyObj<GroupService>;
    dialogRefSpy = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<EditGroupComponent>>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(EditGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with the selected group data', () => {
    expect(component.group().applId).toBe('DON');
    expect(component.group().groupId).toBe('ADM00');
    expect(component.group().description).toBe('Delivers reliable assistance');
    expect(component.group().userCount).toBe(8);
  });

  it('should update description when handleDescriptionChange is called', () => {
    // Create a mock event
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: { value: 'Updated description' } });

    // Call the handler
    component.handleDescriptionChange(event);

    // Verify the description was updated
    expect(component.group().description).toBe('Updated description');
  });

  describe('isChanged computed signal', () => {
    it('should return false when the description has not changed', () => {
      expect(component.isChanged()).toBe(false);
    });

    it('should return true when the description differs from the original', () => {
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: { value: 'New description' } });
      component.handleDescriptionChange(event);

      expect(component.isChanged()).toBe(true);
    });

    it('should return false when the description is changed back to the original', () => {
      // Change to something else
      const event1 = new Event('input');
      Object.defineProperty(event1, 'target', { value: { value: 'Temporary change' } });
      component.handleDescriptionChange(event1);
      expect(component.isChanged()).toBe(true);

      // Change back to original
      const event2 = new Event('input');
      Object.defineProperty(event2, 'target', { value: { value: 'Delivers reliable assistance' } });
      component.handleDescriptionChange(event2);
      expect(component.isChanged()).toBe(false);
    });
  });

  describe('isSubmitting signal', () => {
    it('should initially be false', () => {
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('handleDescriptionChange', () => {
    it('should preserve other group fields when updating description', () => {
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: { value: 'Changed desc' } });
      component.handleDescriptionChange(event);

      const group = component.group();
      expect(group.applId).toBe('DON');
      expect(group.groupId).toBe('ADM00');
      expect(group.userCount).toBe(8);
      expect(group.description).toBe('Changed desc');
    });

    it('should handle empty string description', () => {
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: { value: '' } });
      component.handleDescriptionChange(event);

      expect(component.group().description).toBe('');
      expect(component.isChanged()).toBe(true);
    });
  });

  describe('confirmChanges', () => {
    it('should call groupService.updateGroup with the current group data', () => {
      const updatedGroup: Group = { ...mockGroup, description: 'Updated desc' };
      groupServiceSpy.updateGroup.and.returnValue(of(updatedGroup));

      // Change description first
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: { value: 'Updated desc' } });
      component.handleDescriptionChange(event);

      component.confirmChanges();

      expect(groupServiceSpy.updateGroup).toHaveBeenCalledTimes(1);
      const calledWith = groupServiceSpy.updateGroup.calls.mostRecent().args[0];
      expect(calledWith.description).toBe('Updated desc');
      expect(calledWith.applId).toBe('DON');
      expect(calledWith.groupId).toBe('ADM00');
    });

    it('should show a success snackbar on successful update', () => {
      const response: Group = { ...mockGroup, description: 'Updated desc' };
      groupServiceSpy.updateGroup.and.returnValue(of(response));

      // Change description
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: { value: 'Updated desc' } });
      component.handleDescriptionChange(event);

      component.confirmChanges();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        '"Updated desc" successfully updated',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['content-snackbar']
        })
      );
    });

    it('should close the dialog with updated data on successful update', () => {
      const response: Group = { ...mockGroup, description: 'Updated desc' };
      groupServiceSpy.updateGroup.and.returnValue(of(response));

      component.confirmChanges();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({ updated: true, group: response });
    });

    it('should set isSubmitting to false after successful update', () => {
      groupServiceSpy.updateGroup.and.returnValue(of(mockGroup));

      component.confirmChanges();

      expect(component.isSubmitting()).toBe(false);
    });

    it('should show an error snackbar on update failure', () => {
      groupServiceSpy.updateGroup.and.returnValue(throwError(() => new Error('Server error')));

      component.confirmChanges();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to update group. Please try again.',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['content-snackbar']
        })
      );
    });

    it('should set isSubmitting to false after update failure', () => {
      groupServiceSpy.updateGroup.and.returnValue(throwError(() => new Error('Server error')));

      component.confirmChanges();

      expect(component.isSubmitting()).toBe(false);
    });

    it('should not close the dialog on update failure', () => {
      groupServiceSpy.updateGroup.and.returnValue(throwError(() => new Error('Server error')));

      component.confirmChanges();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should use the current group description in the success snackbar message', () => {
      groupServiceSpy.updateGroup.and.returnValue(of(mockGroup));

      component.confirmChanges();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Delivers reliable assistance'),
        'DISMISS',
        jasmine.anything()
      );
    });
  });

  describe('cancelChanges', () => {
    it('should close the dialog without passing data', () => {
      component.cancelChanges();

      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });

    it('should not call the group service', () => {
      component.cancelChanges();

      expect(groupServiceSpy.updateGroup).not.toHaveBeenCalled();
    });
  });

  describe('constructor with missing data', () => {
    it('should use default values when data is null', async () => {
      const groupSpy = jasmine.createSpyObj('GroupService', ['updateGroup']);
      const dialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      const snackSpy = createMockMatSnackBar();

      await TestBed.resetTestingModule().configureTestingModule({
        imports: [EditGroupComponent, NoopAnimationsModule, TranslateModule.forRoot()],
        providers: [
          { provide: GroupService, useValue: groupSpy },
          { provide: MatDialogRef, useValue: dialogSpy },
          { provide: MatSnackBar, useValue: snackSpy },
          { provide: MAT_DIALOG_DATA, useValue: null }
        ]
      })
      .overrideComponent(EditGroupComponent, {
        remove: { imports: [MatSnackBarModule] }
      })
      .compileComponents();

      const nullFixture = TestBed.createComponent(EditGroupComponent);
      const nullComponent = nullFixture.componentInstance;
      nullFixture.detectChanges();

      // Should have default values
      expect(nullComponent.group().applId).toBe('');
      expect(nullComponent.group().groupId).toBe('');
      expect(nullComponent.group().description).toBe('');
      expect(nullComponent.group().userCount).toBe(0);
    });

    it('should use default values when data.group is missing', async () => {
      const groupSpy = jasmine.createSpyObj('GroupService', ['updateGroup']);
      const dialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      const snackSpy = createMockMatSnackBar();

      await TestBed.resetTestingModule().configureTestingModule({
        imports: [EditGroupComponent, NoopAnimationsModule, TranslateModule.forRoot()],
        providers: [
          { provide: GroupService, useValue: groupSpy },
          { provide: MatDialogRef, useValue: dialogSpy },
          { provide: MatSnackBar, useValue: snackSpy },
          { provide: MAT_DIALOG_DATA, useValue: {} }
        ]
      })
      .overrideComponent(EditGroupComponent, {
        remove: { imports: [MatSnackBarModule] }
      })
      .compileComponents();

      const emptyFixture = TestBed.createComponent(EditGroupComponent);
      const emptyComponent = emptyFixture.componentInstance;
      emptyFixture.detectChanges();

      expect(emptyComponent.group().applId).toBe('');
      expect(emptyComponent.group().groupId).toBe('');
      expect(emptyComponent.group().description).toBe('');
      expect(emptyComponent.group().userCount).toBe(0);
      expect(emptyComponent.isChanged()).toBe(false);
    });
  });

  describe('data property', () => {
    it('should expose the injected dialog data', () => {
      expect(component.data).toBeDefined();
      expect(component.data.group).toBeDefined();
      expect(component.data.group.groupId).toBe('ADM00');
    });
  });
});
