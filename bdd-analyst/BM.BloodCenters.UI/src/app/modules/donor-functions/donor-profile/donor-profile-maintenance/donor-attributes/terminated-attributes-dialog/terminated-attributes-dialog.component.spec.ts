import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import {
  TerminatedAttributesDialogComponent,
  TerminatedAttributesDialogData
} from './terminated-attributes-dialog.component';
import { DonorAttributesService } from '../services/donor-attributes.service';
import { DonorInterdiction } from '../models/donor-attributes.model';

describe('TerminatedAttributesDialogComponent', () => {
  let component: TerminatedAttributesDialogComponent;
  let fixture: ComponentFixture<TerminatedAttributesDialogComponent>;
  let donorAttributesServiceSpy: jasmine.SpyObj<DonorAttributesService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<TerminatedAttributesDialogComponent>>;

  const mockDialogData: TerminatedAttributesDialogData = {
    donorId: '1234567890',
    donorName: 'John Doe'
  };

  const mockTerminatedAttributes: DonorInterdiction[] = [
    {
      donorId: '1234567890',
      interCode: 'ATTR1',
      interDesc: 'Test Attribute 1',
      effDate: '2024-01-01',
      chapterId: 'CH01',
      interType: 'TYPE1',
      termDate: '2024-06-01',
      insertUser: 'USER01'
    },
    {
      donorId: '1234567890',
      interCode: 'ATTR2',
      interDesc: 'Test Attribute 2',
      effDate: '2024-02-01',
      chapterId: 'CH01',
      interType: 'TYPE2',
      termDate: '2024-07-01',
      insertUser: 'USER02'
    }
  ];

  beforeEach(() => {

    donorAttributesServiceSpy = jasmine.createSpyObj('DonorAttributesService', [
      'getTerminatedAttributes'
    ]);

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    donorAttributesServiceSpy.getTerminatedAttributes.and.returnValue(
      of(mockTerminatedAttributes)
    );



      TestBed.configureTestingModule({
imports: [TerminatedAttributesDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: DonorAttributesService, useValue: donorAttributesServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(TerminatedAttributesDialogComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {

    it('should load terminated attributes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(donorAttributesServiceSpy.getTerminatedAttributes).toHaveBeenCalledWith('1234567890');
      expect(component.terminatedAttributes()).toEqual(mockTerminatedAttributes);
    }));

  });
  describe('Data Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));


    it('should display all column headers', () => {
      const headers = fixture.debugElement.queryAll(By.css('th'));
      const headerTexts = headers.map((h) => h.nativeElement.textContent.trim());

      expect(headerTexts).toContain('Property Code');
      expect(headerTexts).toContain('Description');
      expect(headerTexts).toContain('Effective Date');
      expect(headerTexts).toContain('Termination Date');
      expect(headerTexts).toContain('Created By');
    });


    it('should display attribute data in rows', () => {
      const firstRow = fixture.debugElement.query(By.css('tr.mat-mdc-row'));
      expect(firstRow.nativeElement.textContent).toContain('ATTR1');
      expect(firstRow.nativeElement.textContent).toContain('Test Attribute 1');
      expect(firstRow.nativeElement.textContent).toContain('USER01');
    });
  });
  describe('Date Formatting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should format dates as DD-MMM-YYYY', () => {
      const dateCells = fixture.debugElement.queryAll(By.css('td'));
      const dateCell = dateCells.find((cell) =>
        cell.nativeElement.textContent.includes('-')
      );

      expect(dateCell).toBeTruthy();
      // Verify it matches dd-MMM-yyyy format (e.g., 01-Jan-2024)
      const datePattern = /\d{2}-[A-Za-z]{3}-\d{4}/;
      expect(datePattern.test(dateCell!.nativeElement.textContent)).toBeTrue();
    });
  });

});
