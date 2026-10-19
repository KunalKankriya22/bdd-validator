import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CancelEntireOrderDialogComponent } from './cancel-entire-order-dialog';
import { RegularOrderApiService } from '../../../enter-regular-order/services/regular-order-api.service';
import { of } from 'rxjs';

describe('CancelEntireOrderDialogComponent', () => {
  let component: CancelEntireOrderDialogComponent;
  let fixture: ComponentFixture<CancelEntireOrderDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CancelEntireOrderDialogComponent>>;
  let apiSpy: jasmine.SpyObj<RegularOrderApiService>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiSpy = jasmine.createSpyObj('RegularOrderApiService', ['getCancelCodesLookup']);
    apiSpy.getCancelCodesLookup.and.returnValue(of([
      { code: 'NN', description: 'No longer required' }
    ]));

    await TestBed.configureTestingModule({
      imports: [
        CancelEntireOrderDialogComponent,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: RegularOrderApiService, useValue: apiSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CancelEntireOrderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load cancel codes on init', () => {
    expect(apiSpy.getCancelCodesLookup).toHaveBeenCalled();
    expect(component.cancelCodes().length).toBe(1);
    expect(component.cancelCodes()[0].code).toBe('NN');
  });

  it('should close with null on cancel', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });

  it('should close with cancel code on confirm', () => {
    component.cancelCodeCtrl.setValue('NN');
    component.onConfirm();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ cancelCode: 'NN' });
  });

  it('should disable confirm button when no cancel code selected', () => {
    expect(component.cancelCodeCtrl.invalid).toBeTrue();
    component.cancelCodeCtrl.setValue(null);
    expect(component.cancelCodeCtrl.invalid).toBeTrue();
  });
});
