import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoginService } from '@shared/services/login.service';
import { PathogenReductionManagerService } from '../services/pathogen-reduction-manager.service';
import { PsoralenRemovalPanelComponent, PsoralenRemovalData } from './psoralen-removal-panel.component';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('PsoralenRemovalPanelComponent', () => {
  let component: PsoralenRemovalPanelComponent;
  let fixture: ComponentFixture<PsoralenRemovalPanelComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<PsoralenRemovalPanelComponent>>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let mockPRService: jasmine.SpyObj<PathogenReductionManagerService>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackbarService = createMockSnackbarService();
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockLoginService.getStoredUsername.and.returnValue('TESTUSER');

    mockPRService = jasmine.createSpyObj('PathogenReductionManagerService', [
      'insertSterileDocking'
    ]);
    mockPRService.insertSterileDocking.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [
        PsoralenRemovalPanelComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: LoginService, useValue: mockLoginService },
        { provide: PathogenReductionManagerService, useValue: mockPRService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PsoralenRemovalPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have all display values initialized as empty strings', () => {
    expect(component.unitIdDisplay).toBe('');
    expect(component.processDisplay).toBe('PSORALEN');
    expect(component.weldMachineDisplay).toBe('');
    expect(component.waferLotDisplay).toBe('');
    expect(component.setLotDisplay).toBe('');
  });

  it('should save and close dialog with valid data', () => {
    component.unitIdDisplay = 'UNIT123';
    component.processDisplay = 'Psoralen Process';
    component.weldMachineDisplay = 'Machine1';
    component.waferLotDisplay = 'WL001';
    component.setLotDisplay = 'SL001';
    component.form.patchValue({ weldSealOk: 'Yes' });

    component.onSave();

    const expectedData: PsoralenRemovalData = {
      unitId: 'UNIT123',
      process: 'Psoralen Process',
      weldMachine: 'Machine1',
      waferLot: 'WL001',
      setLot: 'SL001',
      weldSealOk: 'Yes'
    };

    expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Psoralen Removal saved successfully');
    expect(mockDialogRef.close).toHaveBeenCalledWith(expectedData);
    expect(component.isSaving).toBeFalse();
  });
});
