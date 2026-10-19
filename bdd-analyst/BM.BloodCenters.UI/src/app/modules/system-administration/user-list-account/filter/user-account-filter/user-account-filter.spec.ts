import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UserAccountFilterComponent } from './user-account-filter';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('UserAccountFilterComponent', () => {
  let component: UserAccountFilterComponent;
  let fixture: ComponentFixture<UserAccountFilterComponent>;

  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<any>>;

  beforeEach(async () => {
    const dialogRefSpyObj = jasmine.createSpyObj('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      imports: [UserAccountFilterComponent, HttpClientTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpyObj },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    }).compileComponents();

    dialogRefSpy = dialogRefSpyObj;
    fixture = TestBed.createComponent(UserAccountFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should close dialog with form value on apply', fakeAsync(() => {
    const formValue = {
      effectiveDatePeriod: 'AFTER',
      effectiveDate: new Date('2024-01-01'),
      terminationDatePeriod: 'BEFORE',
      terminationDate: new Date('2024-12-31'),
      accountStatus: null
    };

    component.filterForm.setValue(formValue);
    tick();

    component.onApply();

    expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    expect(dialogRefSpy.close).toHaveBeenCalledWith(formValue);
  }));

});
