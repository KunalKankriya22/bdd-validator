import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IlluminationBagRemovalPanelComponent } from './illumination-bag-removal-panel.component';

describe('IlluminationBagRemovalPanelComponent', () => {
  let component: IlluminationBagRemovalPanelComponent;
  let fixture: ComponentFixture<IlluminationBagRemovalPanelComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<IlluminationBagRemovalPanelComponent>>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        IlluminationBagRemovalPanelComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IlluminationBagRemovalPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });



  it('should have weldSealOK control initialized with empty value', () => {
    expect(component.illuminationForm.get('weldSealOK')?.value).toBe('');
  });

  it('should validate form when weldSealOK is set', () => {
    component.illuminationForm.patchValue({ weldSealOK: 'Yes' });
    expect(component.illuminationForm.get('weldSealOK')?.value).toBe('Yes');
  });
});
