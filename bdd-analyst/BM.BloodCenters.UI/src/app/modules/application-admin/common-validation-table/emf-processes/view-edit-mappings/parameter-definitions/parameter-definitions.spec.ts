import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, delay } from 'rxjs';

import { ParameterDefinitionsComponent } from './parameter-definitions';
import { ParameterDefinitionService } from '../../services/parameter-definition.service';
import { ParameterDefinitionDto } from '../../interfaces/parameter-definition.interface';
import { ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('ParameterDefinitionsComponent', () => {
  let component: ParameterDefinitionsComponent;
  let fixture: ComponentFixture<ParameterDefinitionsComponent>;
  let mockService: jasmine.SpyObj<ParameterDefinitionService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockParameters: ParameterDefinitionDto[] = [
    {
      procCode: 'PROC001',
      parmNo: 1,
      parmCode: 'PARAM1',
      parmType: 'CHAR',
      refTable: 'RefTable1',
      refColumn: 'RefCol1',
      defaultValue: 'Default1'
    },
    {
      procCode: 'PROC001',
      parmNo: 2,
      parmCode: 'PARAM2',
      parmType: 'NUM',
      refTable: 'RefTable2',
      refColumn: 'RefCol2',
      defaultValue: '100'
    },
    {
      procCode: 'PROC001',
      parmNo: 3,
      parmCode: 'PARAM3',
      parmType: 'DATE',
      refTable: '',
      refColumn: '',
      defaultValue: '2026-01-01'
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ParameterDefinitionService', [
      'getParameters',
      'deleteParameter'
    ]);
    mockDialog = createMockMatDialog();
    mockSnackBar = createMockMatSnackBar();

    mockService.getParameters.and.returnValue(of(mockParameters));
    mockService.deleteParameter.and.returnValue(of({ success: true }));



      TestBed.configureTestingModule({
      imports: [
        ParameterDefinitionsComponent,
        MatIconModule,
        MatTableModule,
        MatTooltipModule
      ],
      providers: [
        { provide: ParameterDefinitionService, useValue: mockService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });


    


      mockService.getParameters.calls.reset();


      mockService.deleteParameter.calls.reset();


      mockService.getParameters.and.returnValue(of(mockParameters));


      mockService.deleteParameter.and.returnValue(of({ success: true }));


    fixture = TestBed.createComponent(ParameterDefinitionsComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {


    it('should initialize with empty parameters', () => {
      expect(component.parameters()).toEqual([]);
    });



    it('should load parameters on init if processCode is provided', fakeAsync(() => {
      component.processCode = 'PROC001';
      fixture.detectChanges();
      tick();

      expect(mockService.getParameters).toHaveBeenCalledWith('PROC001');
      expect(component.parameters()).toEqual(mockParameters);
    }));


  });

  describe('loadParameters', () => {
    beforeEach(() => {
      component.processCode = 'PROC001';
    });

    it('should load parameters successfully', fakeAsync(() => {
      component.loadParameters();
      tick();

      expect(mockService.getParameters).toHaveBeenCalledWith('PROC001');
      expect(component.parameters()).toEqual(mockParameters);
      expect(component.isLoading()).toBe(false);
    }));






  });

  describe('count getter', () => {
    it('should return 0 when no parameters', () => {
      expect(component.count).toBe(0);
    });

    it('should return correct count of parameters', fakeAsync(() => {
      component.processCode = 'PROC001';
      fixture.detectChanges();
      tick();

      expect(component.count).toBe(3);
    }));
  });
  describe('onDelete', () => {
    it('should open confirmation dialog with correct data', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      mockDialog.open.and.returnValue(dialogRefSpy);

      const param = mockParameters[0];
      component.onDelete(param);

      expect(mockDialog.open).toHaveBeenCalled();
      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      const dialogData = dialogConfig?.data as ConfirmActionDialogData;
      expect(dialogConfig?.width).toBe('400px');
      expect(dialogConfig?.disableClose).toBe(true);
      expect(dialogData.title).toBe('Confirm Delete');
      expect(dialogData.message).toContain('PARAM1');
      expect(dialogData.confirmText).toBe('DELETE PARAMETER');
      expect(dialogData.cancelText).toBe('CANCEL');
    });



    it('should delete parameter when user confirms', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.processCode = 'PROC001';
      const param = mockParameters[0];
      component.onDelete(param);
      tick();

      expect(mockService.deleteParameter).toHaveBeenCalledWith('PROC001', 1);
    }));






  });

  describe('ngOnChanges', () => {
    it('should load parameters when processCode changes', fakeAsync(() => {
      component.processCode = 'PROC001';
      fixture.detectChanges();
      tick();

      mockService.getParameters.calls.reset();

      component.processCode = 'PROC002';
      component.ngOnChanges({
        processCode: {
          currentValue: 'PROC002',
          previousValue: 'PROC001',
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();

      expect(mockService.getParameters).toHaveBeenCalledWith('PROC002');
    }));




  });

  describe('trackById', () => {
    it('should return unique identifier for parameter', () => {
      const param = mockParameters[0];
      const trackId = component.trackById(0, param);

      expect(trackId).toBe('PROC001-1');
    });

    it('should return different ids for different parameters', () => {
      const param1 = mockParameters[0];
      const param2 = mockParameters[1];

      const trackId1 = component.trackById(0, param1);
      const trackId2 = component.trackById(1, param2);

      expect(trackId1).not.toBe(trackId2);
      expect(trackId1).toBe('PROC001-1');
      expect(trackId2).toBe('PROC001-2');
    });
  });

  describe('Error Handling', () => {
    it('should handle delete API error gracefully', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(dialogRefSpy);

      mockService.deleteParameter.and.returnValue(
        throwError(() => new Error('Delete failed'))
      );

      component.processCode = 'PROC001';
      const param = mockParameters[0];
      component.onDelete(param);
      tick();

      expect(component.isLoading()).toBe(false);
    }));


  });

  describe('Integration', () => {
    it('should update parameters list after delete', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.processCode = 'PROC001';
      fixture.detectChanges();
      tick();

      expect(component.parameters().length).toBe(3);

      const updatedParams = [mockParameters[1], mockParameters[2]];
      mockService.getParameters.and.returnValue(of(updatedParams));

      const param = mockParameters[0];
      component.onDelete(param);
      tick();

      expect(component.parameters().length).toBe(2);
      expect(component.parameters()[0].parmCode).toBe('PARAM2');
    }));

    it('should maintain correct loading state through operations', fakeAsync(() => {
      mockService.getParameters.and.returnValue(
        of(mockParameters).pipe(delay(10))
      );

      component.processCode = 'PROC001';

      expect(component.isLoading()).toBe(false);

      component.loadParameters();
      expect(component.isLoading()).toBe(true);

      tick(10);
      expect(component.isLoading()).toBe(false);
    }));
  });
});
