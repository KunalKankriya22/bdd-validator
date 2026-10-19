import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ContactsInformationDialogComponent } from './contacts-information-dialog.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ContactsInformationDialogComponent', () => {
  let component: ContactsInformationDialogComponent;
  let fixture: ComponentFixture<ContactsInformationDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ContactsInformationDialogComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ContactsInformationDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContactsInformationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with one empty contact', () => {
    expect(component.contacts.length).toBe(1);
  });







  it('should clear all contacts', () => {
    component.onAddAnotherContact();
    component.contacts.at(0).patchValue({
      type: 'Facility',
      lastName: 'Smith',
      firstName: 'John'
    });

    component.onClearAll();

    expect(component.contacts.length).toBe(1);
    expect(component.contacts.at(0).get('lastName')?.value).toBe('');
  });

  it('should close dialog with contacts data on save', () => {
    component.contacts.at(0).patchValue({
      type: 'Facility',
      lastName: 'Smith',
      firstName: 'John'
    });

    component.onSave();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.arrayContaining([
      jasmine.objectContaining({
        type: 'Facility',
        lastName: 'Smith',
        firstName: 'John'
      })
    ]));
  });


  it('should close dialog without data on cancel', () => {
    component.onCancel();

    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });
});
