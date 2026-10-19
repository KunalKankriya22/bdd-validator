import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CadBagRemovalPanelComponent, CadBagRemovalData } from './cad-bag-removal-panel.component';

describe('CadBagRemovalPanelComponent', () => {
  let component: CadBagRemovalPanelComponent;
  let fixture: ComponentFixture<CadBagRemovalPanelComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CadBagRemovalPanelComponent>>;

  const mockData: CadBagRemovalData = {
    unitId: 'UNIT123',
    parsedUnitId: '00UNIT123',
    suitProdCode: 'PLT01'
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        CadBagRemovalPanelComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CadBagRemovalPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should load data when provided', async () => {
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [
        CadBagRemovalPanelComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    const fixtureWithData = TestBed.createComponent(CadBagRemovalPanelComponent);
    const componentWithData = fixtureWithData.componentInstance;
    fixtureWithData.detectChanges();

    expect(componentWithData.unitIdDisplay).toBe(mockData.unitId);
    expect(componentWithData.parsedUnitIdForApi).toBe(mockData.parsedUnitId);
  });



  it('should validate form correctly', () => {
    component.cadRemovalForm.patchValue({ weldSealOK: 'Yes' });
    expect(component.cadRemovalForm.valid).toBeTrue();
  });
});
