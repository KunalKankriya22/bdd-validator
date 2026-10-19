import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';

import { AlternateDemographicsComponent } from './alternate-demographics';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('AlternateDemographicsComponent', () => {
  let component: AlternateDemographicsComponent;
  let fixture: ComponentFixture<AlternateDemographicsComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    mockDialog = createMockMatDialog();
    mockDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: MatDialog, useValue: mockDialog }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should default mode to edit', () => {
    expect(component.searchForm.get('mode')?.value).toBe('edit');
  });

  it('should open dialog with readOnly=true in view mode', () => {
    component.searchForm.patchValue({ mode: 'view', donorId: 'DN002' });

    component.onViewAlternateDemographics();

    expect(mockDialog.open).toHaveBeenCalledTimes(1);
    expect(mockDialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: { donorId: 'DN002', readOnly: true }
      })
    );
  });

  it('should open dialog with readOnly=false in edit mode', () => {
    component.searchForm.patchValue({ mode: 'edit', donorId: 'DN003' });

    component.onViewAlternateDemographics();

    expect(mockDialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: { donorId: 'DN003', readOnly: false }
      })
    );
  });

  it('should mark form as touched when submitting invalid form', () => {
    component.searchForm.patchValue({ donorId: '' });

    component.onViewAlternateDemographics();

    expect(component.searchForm.get('donorId')?.touched).toBeTrue();
    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  it('should have required validator on donorId', () => {
    component.searchForm.get('donorId')?.setValue('');
    expect(component.searchForm.get('donorId')?.hasError('required')).toBeTrue();
  });

  it('should have required validator on mode', () => {
    component.searchForm.get('mode')?.setValue('');
    expect(component.searchForm.get('mode')?.hasError('required')).toBeTrue();
  });

  it('should expose form controls via f getter', () => {
    expect(component.f['mode']).toBeDefined();
    expect(component.f['donorId']).toBeDefined();
  });

  it('should initialize headerConfig with empty values', () => {
    expect(component.headerConfig.breadcrumbs).toBeDefined();
    expect(component.headerConfig.title).toBeDefined();
  });

  it('should clean up subscriptions on destroy', () => {
    const destroySpy = jest.spyOn(component['destroy$'], 'next');
    const completeSpy = jest.spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});

describe('AlternateDemographicsComponent - with queryParams', () => {
  let component: AlternateDemographicsComponent;
  let fixture: ComponentFixture<AlternateDemographicsComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let queryParamsSubject: Subject<Record<string, string>>;

  beforeEach(() => {
    mockDialog = createMockMatDialog();
    mockDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
    queryParamsSubject = new Subject();

    TestBed.configureTestingModule({
      imports: [AlternateDemographicsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: MatDialog, useValue: mockDialog },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable(),
            snapshot: { queryParams: {} }
          }
        }
      ]
    });

    fixture = TestBed.createComponent(AlternateDemographicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should auto-open dialog when donorId is in query params', () => {
    queryParamsSubject.next({ donorId: 'DN999' });

    expect(component.searchForm.get('donorId')?.value).toBe('DN999');
    expect(component.searchForm.get('mode')?.value).toBe('edit');
    expect(mockDialog.open).toHaveBeenCalledTimes(1);
  });

  it('should not open dialog when query params have no donorId', () => {
    queryParamsSubject.next({});

    expect(mockDialog.open).not.toHaveBeenCalled();
  });
});
