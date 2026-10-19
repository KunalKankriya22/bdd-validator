import { fakeAsync, tick, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import { UserAccessClassDialogService } from './user-access-class-dialog.service';
import { AssignEditUserAccessClassComponent } from '../define-user-access/assign-edit-user-access-class/assign-edit-user-access-class';
import { createMockMatDialog } from '@shared/testing/common-mocks';
import {
  UserAccessInfo,
  UserAccessClassRow,
  AssignEditAccessClassDialogResult,
  AssignEditAccessClassDialogData
} from '../models/user-access.model';

describe('UserAccessClassDialogService', () => {
  let dialogSpy: any;
  let service: UserAccessClassDialogService;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockUserInfo: UserAccessInfo = {
    userId: 'USER001',
    userName: 'John Doe',
    department: 'IT Department'
  };

  const mockAccessClassRow: UserAccessClassRow = {
    accessClass: 'ADMIN',
    description: 'Administrator Access',
    level: 1,
    effectiveDate: '2024-01-01',
    terminationDate: '2024-12-31'
  };

  beforeEach(() => {
    dialogSpy = createMockMatDialog();

        service = new UserAccessClassDialogService(dialogSpy as any);
    dialog = dialogSpy;
  });
  describe('openAssignAccessClassDialog', () => {
    let afterClosedSubject: Subject<AssignEditAccessClassDialogResult | undefined>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<AssignEditUserAccessClassComponent>>;

    beforeEach(() => {
      afterClosedSubject = new Subject<AssignEditAccessClassDialogResult | undefined>();
      mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(afterClosedSubject.asObservable());
      dialog.open.and.returnValue(mockDialogRef);
    });



    it('should open dialog with correct configuration', () => {
      service.openAssignAccessClassDialog(mockUserInfo).subscribe();

      const config = dialog.open.calls.mostRecent().args[1];
      expect(config?.width).toBe('754px');
      expect(config?.maxWidth).toBe('100vw');
      expect(config?.disableClose).toBeTrue();
      expect(config?.position).toEqual({ right: '0', top: '64px' });
      expect(config?.panelClass).toBe('right-side-drawer');
    });

    it('should pass correct data for assign mode', () => {
      service.openAssignAccessClassDialog(mockUserInfo).subscribe();

      const config = dialog.open.calls.mostRecent().args[1];
      expect(config?.data).toEqual({
        mode: 'assign',
        user: {
          userId: 'USER001',
          userName: 'John Doe',
          department: 'IT Department'
        }
      });
    });

    it('should return true when dialog closes with success result', fakeAsync(() => {
      let result: boolean | undefined;
      service.openAssignAccessClassDialog(mockUserInfo).subscribe(value => {
        result = value;
      });

      afterClosedSubject.next({ success: true });
      afterClosedSubject.complete();
      tick();

      expect(result).toBeTrue();
    }));

    it('should return false when dialog closes with failure result', fakeAsync(() => {
      let result: boolean | undefined;
      service.openAssignAccessClassDialog(mockUserInfo).subscribe(value => {
        result = value;
      });

      afterClosedSubject.next({ success: false });
      afterClosedSubject.complete();
      tick();

      expect(result).toBeFalse();
    }));

    it('should return false when dialog closes with undefined result', fakeAsync(() => {
      let result: boolean | undefined;
      service.openAssignAccessClassDialog(mockUserInfo).subscribe(value => {
        result = value;
      });

      afterClosedSubject.next(undefined);
      afterClosedSubject.complete();
      tick();

      expect(result).toBeFalse();
    }));

    it('should return false when dialog closes with null result', fakeAsync(() => {
      let result: boolean | undefined;
      service.openAssignAccessClassDialog(mockUserInfo).subscribe(value => {
        result = value;
      });

      afterClosedSubject.next(null as any);
      afterClosedSubject.complete();
      tick();

      expect(result).toBeFalse();
    }));

    it('should complete the observable after dialog closes', fakeAsync(() => {
      let completed = false;
      service.openAssignAccessClassDialog(mockUserInfo).subscribe({
        complete: () => { completed = true; }
      });

      afterClosedSubject.next({ success: true });
      afterClosedSubject.complete();
      tick();

      expect(completed).toBeTrue();
    }));

    it('should handle user info with empty department', () => {
      const userWithEmptyDept: UserAccessInfo = {
        userId: 'USER002',
        userName: 'Jane Doe',
        department: ''
      };

      service.openAssignAccessClassDialog(userWithEmptyDept).subscribe();

      const config = dialog.open.calls.mostRecent().args[1];
      const data = config?.data as AssignEditAccessClassDialogData;
      expect(data.user.department).toBe('');
    });
  });

  describe('openEditAccessClassDialog', () => {
    let afterClosedSubject: Subject<AssignEditAccessClassDialogResult | undefined>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<AssignEditUserAccessClassComponent>>;

    beforeEach(() => {
      afterClosedSubject = new Subject<AssignEditAccessClassDialogResult | undefined>();
      mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(afterClosedSubject.asObservable());
      dialog.open.and.returnValue(mockDialogRef);
    });



    it('should open dialog with correct configuration', () => {
      service.openEditAccessClassDialog(mockUserInfo, mockAccessClassRow).subscribe();

      const config = dialog.open.calls.mostRecent().args[1];
      expect(config?.width).toBe('754px');
      expect(config?.maxWidth).toBe('100vw');
      expect(config?.disableClose).toBeTrue();
      expect(config?.position).toEqual({ right: '0', top: '64px' });
      expect(config?.panelClass).toBe('right-side-drawer');
    });

    it('should pass correct data for edit mode', () => {
      service.openEditAccessClassDialog(mockUserInfo, mockAccessClassRow).subscribe();

      const config = dialog.open.calls.mostRecent().args[1];
      expect(config?.data).toEqual({
        mode: 'edit',
        user: {
          userId: 'USER001',
          userName: 'John Doe',
          department: 'IT Department'
        },
        accessClassData: {
          accessClass: 'ADMIN',
          description: 'Administrator Access',
          level: 1,
          effectiveDate: '2024-01-01',
          terminationDate: '2024-12-31'
        }
      });
    });

    it('should return true when dialog closes with success result', fakeAsync(() => {
      let result: boolean | undefined;
      service.openEditAccessClassDialog(mockUserInfo, mockAccessClassRow).subscribe(value => {
        result = value;
      });

      afterClosedSubject.next({ success: true });
      afterClosedSubject.complete();
      tick();

      expect(result).toBeTrue();
    }));

    it('should return false when dialog closes with failure result', fakeAsync(() => {
      let result: boolean | undefined;
      service.openEditAccessClassDialog(mockUserInfo, mockAccessClassRow).subscribe(value => {
        result = value;
      });

      afterClosedSubject.next({ success: false });
      afterClosedSubject.complete();
      tick();

      expect(result).toBeFalse();
    }));

    it('should return false when dialog closes with undefined result', fakeAsync(() => {
      let result: boolean | undefined;
      service.openEditAccessClassDialog(mockUserInfo, mockAccessClassRow).subscribe(value => {
        result = value;
      });

      afterClosedSubject.next(undefined);
      afterClosedSubject.complete();
      tick();

      expect(result).toBeFalse();
    }));

    it('should complete the observable after dialog closes', fakeAsync(() => {
      let completed = false;
      service.openEditAccessClassDialog(mockUserInfo, mockAccessClassRow).subscribe({
        complete: () => { completed = true; }
      });

      afterClosedSubject.next({ success: true });
      afterClosedSubject.complete();
      tick();

      expect(completed).toBeTrue();
    }));

    it('should handle access class row with empty termination date', () => {
      const rowWithEmptyTermDate: UserAccessClassRow = {
        ...mockAccessClassRow,
        terminationDate: ''
      };

      service.openEditAccessClassDialog(mockUserInfo, rowWithEmptyTermDate).subscribe();

      const config = dialog.open.calls.mostRecent().args[1];
      const data = config?.data as AssignEditAccessClassDialogData;
      expect(data.accessClassData?.terminationDate).toBe('');
    });

    it('should handle different access levels', () => {
      const rowWithDifferentLevel: UserAccessClassRow = {
        ...mockAccessClassRow,
        level: 9
      };

      service.openEditAccessClassDialog(mockUserInfo, rowWithDifferentLevel).subscribe();

      const config = dialog.open.calls.mostRecent().args[1];
      const data = config?.data as AssignEditAccessClassDialogData;
      expect(data.accessClassData?.level).toBe(9);
    });
  });
});

describe('UserAccessClassDialogService Integration Tests', () => {
  let service: UserAccessClassDialogService;
  let dialog: jasmine.SpyObj<MatDialog>;
  let afterClosedSubject: any;
  let mockDialogRef: any;

  const mockUserInfo: UserAccessInfo = {
    userId: 'USER001',
    userName: 'John Doe',
    department: 'IT Department'
  };

  const mockAccessClassRow: UserAccessClassRow = {
    accessClass: 'ADMIN',
    description: 'Administrator Access',
    level: 1,
    effectiveDate: '2024-01-01',
    terminationDate: '2024-12-31'
  };

  beforeEach(() => {
    const dialogSpy = createMockMatDialog();
    TestBed.configureTestingModule({
      providers: [
        UserAccessClassDialogService,
        { provide: MatDialog, useValue: dialogSpy }
      ]
    });

    service = TestBed.inject(UserAccessClassDialogService);
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  });

  it('should handle multiple sequential dialog opens', fakeAsync(() => {
    const afterClosedSubject1 = new Subject<AssignEditAccessClassDialogResult>();
    const afterClosedSubject2 = new Subject<AssignEditAccessClassDialogResult>();

    const mockDialogRef1 = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef1.afterClosed.and.returnValue(afterClosedSubject1.asObservable());

    const mockDialogRef2 = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef2.afterClosed.and.returnValue(afterClosedSubject2.asObservable());

    dialog.open.and.returnValues(mockDialogRef1, mockDialogRef2);

    let result1: boolean | undefined;
    let result2: boolean | undefined;

    // Open first dialog
    service.openAssignAccessClassDialog(mockUserInfo).subscribe(value => {
      result1 = value;
    });

    // Close first dialog
    afterClosedSubject1.next({ success: true });
    afterClosedSubject1.complete();
    tick();

    expect(result1).toBeTrue();

    // Open second dialog
    service.openEditAccessClassDialog(mockUserInfo, mockAccessClassRow).subscribe(value => {
      result2 = value;
    });

    // Close second dialog
    afterClosedSubject2.next({ success: false });
    afterClosedSubject2.complete();
    tick();

    expect(result2).toBeFalse();
    expect(dialog.open).toHaveBeenCalledTimes(2);
  }));

  it('should pass user data correctly through the workflow', fakeAsync(() => {
    afterClosedSubject = new Subject<AssignEditAccessClassDialogResult>();
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef.afterClosed.and.returnValue(afterClosedSubject.asObservable());
    dialog.open.and.returnValue(mockDialogRef);

    const customUserInfo: UserAccessInfo = {
      userId: 'CUSTOM_USER',
      userName: 'Custom User Name',
      department: 'Custom Department'
    };

    service.openAssignAccessClassDialog(customUserInfo).subscribe();

    const config = dialog.open.calls.mostRecent().args[1];
    const data = config?.data as AssignEditAccessClassDialogData;
    expect(data.user).toEqual({
      userId: 'CUSTOM_USER',
      userName: 'Custom User Name',
      department: 'Custom Department'
    });

    afterClosedSubject.complete();
  }));

  it('should pass access class data correctly through edit workflow', fakeAsync(() => {
    const afterClosedSubject = new Subject<AssignEditAccessClassDialogResult>();
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef.afterClosed.and.returnValue(afterClosedSubject.asObservable());
    dialog.open.and.returnValue(mockDialogRef);

    const customAccessClassRow: UserAccessClassRow = {
      accessClass: 'CUSTOM_CLASS',
      description: 'Custom Description',
      level: 5,
      effectiveDate: '2025-01-01',
      terminationDate: '2025-12-31'
    };

    service.openEditAccessClassDialog(mockUserInfo, customAccessClassRow).subscribe();

    const config = dialog.open.calls.mostRecent().args[1];
    const data = config?.data as AssignEditAccessClassDialogData;
    expect(data.accessClassData).toEqual({
      accessClass: 'CUSTOM_CLASS',
      description: 'Custom Description',
      level: 5,
      effectiveDate: '2025-01-01',
      terminationDate: '2025-12-31'
    });

    afterClosedSubject.complete();
  }));

  it('should use consistent dialog configuration for both modes', () => {
    const afterClosedSubject = new Subject<AssignEditAccessClassDialogResult>();
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef.afterClosed.and.returnValue(afterClosedSubject.asObservable());
    dialog.open.and.returnValue(mockDialogRef);

    // Open assign dialog
    service.openAssignAccessClassDialog(mockUserInfo).subscribe();
    const assignConfig = dialog.open.calls.mostRecent().args[1];

    // Reset calls
    dialog.open.calls.reset();
    dialog.open.and.returnValue(mockDialogRef);

    // Open edit dialog
    service.openEditAccessClassDialog(mockUserInfo, mockAccessClassRow).subscribe();
    const editConfig = dialog.open.calls.mostRecent().args[1];

    // Verify consistent configuration
    expect(assignConfig?.width).toBe(editConfig?.width);
    expect(assignConfig?.maxWidth).toBe(editConfig?.maxWidth);
    expect(assignConfig?.disableClose).toBe(editConfig?.disableClose);
    expect(assignConfig?.position).toEqual(editConfig?.position);
    expect(assignConfig?.panelClass).toBe(editConfig?.panelClass);

    afterClosedSubject.complete();
  });
});
