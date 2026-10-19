import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AssociationWarningDialogComponent } from './association-warning-dialog';
import { AssociationWarningData } from '../../models/valid-collection-facilities.model';

describe('AssociationWarningDialogComponent', () => {
  let component: AssociationWarningDialogComponent;
  let fixture: ComponentFixture<AssociationWarningDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AssociationWarningDialogComponent>>;

  const mockData: AssociationWarningData = {
    collId: 'FAC01',
    associations: [
      { contractId: 'CONTRACT1', companyName: 'ABC Blood Services' },
      { contractId: 'CONTRACT2', companyName: 'XYZ Medical Center' },
    ],
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AssociationWarningDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssociationWarningDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {


    it('should display warning icon', () => {
      const icon = fixture.debugElement.query(By.css('.warning-icon'));
      expect(icon).toBeTruthy();
      expect(icon.nativeElement.textContent.trim()).toBe('warning');
    });
  });

  describe('Data Display', () => {
    it('should display association table with correct data', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'));
      expect(rows.length).toBe(2);
    });



    it('should display confirmation message', () => {
      const message = fixture.debugElement.query(By.css('.dialog-message'));
      expect(message.nativeElement.textContent.trim()).toContain(
        'Allow the same Collection ID (FIN) to be assigned to the contract.'
      );
    });
  });

  describe('User Actions', () => {


    it('should have NO button with correct text', () => {
      const noButton = fixture.debugElement.query(By.css('.no-assign-btn'));
      expect(noButton.nativeElement.textContent.trim()).toBe("NO, DON'T ASSIGN");
    });

    it('should have YES button with correct text', () => {
      const yesButton = fixture.debugElement.query(By.css('.yes-assign-btn'));
      expect(yesButton.nativeElement.textContent.trim()).toBe('YES, ASSIGN IT');
    });
  });
  describe('Multiple Instances', () => {
    it('should have different component IDs across instances', () => {
      const fixture2 = TestBed.createComponent(AssociationWarningDialogComponent);
      const component2 = fixture2.componentInstance;

      expect(component['componentId']).not.toBe(component2['componentId']);
    });
  });
});
