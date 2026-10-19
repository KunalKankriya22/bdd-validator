import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ViewCodeType } from './view-code-type';
import { CodeType, DonorMasterCodesService } from '../../services/donor-master-codes.service';
import { FilterDonorMasterCodesComponent } from '../../filter-donor-master-codes/filter-donor-master-codes';
import { CodeTypeDialogService } from '../services/code-type-dialog.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { createMockMatSnackBar, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ViewCodeType', () => {
  let component: ViewCodeType;
  let fixture: ComponentFixture<ViewCodeType>;
  let mockService: jasmine.SpyObj<DonorMasterCodesService>;
  let mockActivatedRoute: any;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogService: jasmine.SpyObj<CodeTypeDialogService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;

  const mockCodeTypes: CodeType[] = [];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DonorMasterCodesService', [
      'getMasterCodesByType',
      'getMasterCodeById',
      'createMasterCode',
      'updateMasterCode',
      'deleteMasterCode',
      'getMasterCodes',
      'getCodeTypesByCode',
      'createCodeType',
      'updateCodeType'
    ]);
    mockActivatedRoute = {
      params: of({ code: 'APITY' })
    };
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'getCurrentNavigation'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.getCurrentNavigation.and.returnValue({ extras: { state: {} } } as any);
    mockDialog = createMockMatDialog();
    mockDialogService = jasmine.createSpyObj('CodeTypeDialogService', ['openAddCodeTypeDialog', 'openEditCodeTypeDialog']);
    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = createMockHeaderService();
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockLoginService.getStoredUsername.and.returnValue('testuser');

    (mockDialog as any).openDialogs = [];
    mockDialog.open.and.callFake(() => {
      (mockDialog as any).openDialogs.push({});
      return { afterClosed: () => of(null) } as any;
    });



      TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ViewCodeType,
        MatDialogModule,
        MatTableModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        FilterDonorMasterCodesComponent
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DonorMasterCodesService, useValue: mockService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: CodeTypeDialogService, useValue: mockDialogService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService }
      ]
    });
      mockRouter.getCurrentNavigation.and.returnValue({ extras: { state: {} } } as any);
      mockLoginService.getStoredUsername.and.returnValue('testuser');


      mockDialog.open.and.callFake(() => {
        return { afterClosed: () => of(null) } as any;
      });

    fixture = TestBed.createComponent(ViewCodeType);
    component = fixture.componentInstance;
  });

  describe('isRowHighlighted', () => {
    const mockRow: CodeType = {
      code: 'ABC',
      codeType: 'APITY',
      description: 'Test code',
      effDate: new Date('2024-01-01'),
      termDate: null
    };

    it('should return true when selectedRow matches the given row code', () => {
      component['selectedRow'] = mockRow;
      expect(component.isRowHighlighted(mockRow)).toBeTrue();
    });

    it('should return false when selectedRow is null', () => {
      component['selectedRow'] = null;
      expect(component.isRowHighlighted(mockRow)).toBeFalse();
    });

    it('should return false when selectedRow has a different code', () => {
      component['selectedRow'] = { ...mockRow, code: 'XYZ' };
      expect(component.isRowHighlighted(mockRow)).toBeFalse();
    });
  });

  describe('onDescriptionHover', () => {
    it('should disable tooltip when element is not overflowing', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 100 });
      Object.defineProperty(el, 'clientWidth', { value: 200 });
      const event = { currentTarget: el } as unknown as MouseEvent;

      component.onDescriptionHover(event, 'ABC');

      expect(component.descriptionTooltipDisabled.get('ABC')).toBeTrue();
    });

    it('should not disable tooltip when element is overflowing', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 300 });
      Object.defineProperty(el, 'clientWidth', { value: 200 });
      const event = { currentTarget: el } as unknown as MouseEvent;

      component.onDescriptionHover(event, 'ABC');

      expect(component.descriptionTooltipDisabled.get('ABC')).toBeUndefined();
    });
  });

  describe('getStatus', () => {
    it('should return "active" for null termination date', () => {
      const status = component.getStatus(null);

      expect(status).toBe('active');
    });

    it('should return "active" for future termination date', () => {
      const futureDate = new Date('2026-12-31');
      const status = component.getStatus(futureDate);

      expect(status).toBe('active');
    });

    it('should return "inactive" for past termination date', () => {
      const pastDate = new Date('2024-01-01');
      const status = component.getStatus(pastDate);

      expect(status).toBe('inactive');
    });
  });
});
