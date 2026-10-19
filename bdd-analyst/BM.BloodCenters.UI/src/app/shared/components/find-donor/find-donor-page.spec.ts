import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { FindDonorPage } from './find-donor-page';
import { FindDonorDialog } from './find-donor';
import { FindDonorDialogResult } from './find-donor.model';
import { ROUTE_REGISTRY } from '../../../core/constants/route-registry';
import { RouteKey } from '../../../core/constants/route-keys';

describe('FindDonorPage', () => {
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;
  let afterClosedSubject: Subject<FindDonorDialogResult>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<FindDonorDialog>>;

  function createComponent(routeData: Record<string, unknown> = {}): FindDonorPage {
    afterClosedSubject = new Subject<FindDonorDialogResult>();
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef.afterClosed.and.returnValue(afterClosedSubject.asObservable());

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(mockDialogRef);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: routeData } },
        },
      ],
    });

    return TestBed.createComponent(FindDonorPage).componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('should default donorMode to "add" when route data is empty', () => {
    createComponent({});

    expect(dialogSpy.open).toHaveBeenCalledTimes(1);
    const dialogData = dialogSpy.open.calls.mostRecent().args[1]!.data;
    expect(dialogData.mode).toBe('add');
  });

  it('should read "modify" from route data', () => {
    createComponent({ donorMode: 'modify' });

    expect(dialogSpy.open).toHaveBeenCalledTimes(1);
    const dialogData = dialogSpy.open.calls.mostRecent().args[1]!.data;
    expect(dialogData.mode).toBe('modify');
  });

  it('should open dialog with correct config', () => {
    createComponent({});

    expect(dialogSpy.open).toHaveBeenCalledWith(FindDonorDialog, {
      width: '1184px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'find-donor-panel',
      data: { mode: 'add' },
    });
  });

  it('should navigate to AddDonorForm with mode "add" and search criteria when dialog result is "new"', () => {
    createComponent({});

    const criteria = {
      lastName: 'Smith',
      firstName: 'John',
      dob: '1990-01-15',
    };

    afterClosedSubject.next({ action: 'new', searchCriteria: criteria });
    afterClosedSubject.complete();

    const expectedPath = ROUTE_REGISTRY[RouteKey.AddDonorForm].path;
    expect(routerSpy.navigate).toHaveBeenCalledTimes(1);

    const [navPath, navExtras] = routerSpy.navigate.calls.mostRecent().args;
    expect(navPath).toEqual([expectedPath]);

    const state = navExtras!.state as Record<string, unknown>;
    expect(state['mode']).toBe('add');
    expect(state['searchCriteria']).toBeDefined();
    expect((state['searchCriteria'] as Record<string, unknown>)['lastName']).toBe('Smith');
    expect((state['searchCriteria'] as Record<string, unknown>)['firstName']).toBe('John');
    expect((state['searchCriteria'] as Record<string, unknown>)['dob']).toBe('1990-01-15');
  });

  it('should navigate to AddDonorForm with mode "modify" and donorId when dialog result is "select"', () => {
    createComponent({});

    afterClosedSubject.next({
      action: 'select',
      donor: { donorId: 'D00123' },
    });
    afterClosedSubject.complete();

    const expectedPath = ROUTE_REGISTRY[RouteKey.AddDonorForm].path;
    expect(routerSpy.navigate).toHaveBeenCalledTimes(1);

    const [navPath, navExtras] = routerSpy.navigate.calls.mostRecent().args;
    expect(navPath).toEqual([expectedPath]);
    expect(navExtras!.state).toEqual({
      mode: 'modify',
      donorId: 'D00123',
    });
  });

  it('should navigate to /home when dialog result is "cancel"', () => {
    createComponent({});

    afterClosedSubject.next({ action: 'cancel' });
    afterClosedSubject.complete();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should navigate to /home when dialog result is undefined', () => {
    createComponent({});

    afterClosedSubject.next(undefined);
    afterClosedSubject.complete();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should serialize dob to string in searchCriteria when dob is provided', () => {
    createComponent({});

    const criteria = {
      lastName: 'Doe',
      dob: '2000-06-30',
    };

    afterClosedSubject.next({ action: 'new', searchCriteria: criteria });
    afterClosedSubject.complete();

    const [, navExtras] = routerSpy.navigate.calls.mostRecent().args;
    const state = navExtras!.state as Record<string, unknown>;
    const searchCriteria = state['searchCriteria'] as Record<string, unknown>;
    expect(searchCriteria['dob']).toBe('2000-06-30');
    expect(typeof searchCriteria['dob']).toBe('string');
  });

  it('should set dob to undefined in searchCriteria when dob is falsy', () => {
    createComponent({});

    const criteria = {
      lastName: 'Doe',
      dob: '',
    };

    afterClosedSubject.next({ action: 'new', searchCriteria: criteria });
    afterClosedSubject.complete();

    const [, navExtras] = routerSpy.navigate.calls.mostRecent().args;
    const state = navExtras!.state as Record<string, unknown>;
    const searchCriteria = state['searchCriteria'] as Record<string, unknown>;
    expect(searchCriteria['dob']).toBeUndefined();
  });

  it('should handle "new" result with no searchCriteria', () => {
    createComponent({});

    afterClosedSubject.next({ action: 'new' });
    afterClosedSubject.complete();

    const expectedPath = ROUTE_REGISTRY[RouteKey.AddDonorForm].path;
    const [navPath, navExtras] = routerSpy.navigate.calls.mostRecent().args;
    expect(navPath).toEqual([expectedPath]);

    const state = navExtras!.state as Record<string, unknown>;
    expect(state['mode']).toBe('add');
    expect(state['searchCriteria']).toBeUndefined();
  });
});
