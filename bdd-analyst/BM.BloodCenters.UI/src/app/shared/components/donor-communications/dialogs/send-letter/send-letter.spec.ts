import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { SendLetterDialogComponent } from './send-letter';
import { DonorCommunicationsService } from '../../services/donor-communications.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('SendLetterDialogComponent', () => {
  let component: SendLetterDialogComponent;
  let fixture: ComponentFixture<SendLetterDialogComponent>;
  let serviceSpy: jasmine.SpyObj<DonorCommunicationsService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SendLetterDialogComponent>>;

  // Relative date for test data
  const fourMonthsAgo = moment().subtract(4, 'months').format('YYYY-MM-DD');

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DonorCommunicationsService', [
      'getCommunicationTypes',
      'getCommunicationCodes',
      'getLetterCodes',
      'retrieveLetterTemplate',
      'generateLetter',
      'saveAndPrintLetter'
    ]);
    snackbarSpy = createMockSnackbarService();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    serviceSpy.getCommunicationTypes.and.returnValue(of([
      { code: 'MAIL', description: 'Mail Communication' }
    ]));
    serviceSpy.getCommunicationCodes.and.returnValue(of([
      { code: 'THK', description: 'Thank You' }
    ]));
    serviceSpy.getLetterCodes.and.returnValue(of([
      { code: 'L001', description: 'Thank You Letter' }
    ]));
    serviceSpy.retrieveLetterTemplate.and.returnValue(of({
      code: 'L001',
      description: 'Thank You Letter',
      versionNumber: '1.0',
      versionDate: fourMonthsAgo,
      letterText: 'Dear donor...'
    }));
    serviceSpy.generateLetter.and.returnValue(of('Generated letter text'));
    serviceSpy.saveAndPrintLetter.and.returnValue(of(void 0));



      TestBed.configureTestingModule({
      imports: [SendLetterDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: DonorCommunicationsService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'D123456' } }
      ]
    });


    


      serviceSpy.getCommunicationTypes.calls.reset();


      serviceSpy.getCommunicationCodes.calls.reset();


      serviceSpy.getLetterCodes.calls.reset();


      serviceSpy.retrieveLetterTemplate.calls.reset();


      serviceSpy.generateLetter.calls.reset();


      serviceSpy.saveAndPrintLetter.calls.reset();


      dialogRefSpy.close.calls.reset();


      serviceSpy.generateLetter.and.returnValue(of('Generated letter text'));


      serviceSpy.saveAndPrintLetter.and.returnValue(of(void 0));


    fixture = TestBed.createComponent(SendLetterDialogComponent);
    component = fixture.componentInstance;


    });




  it('should retrieve letter template', () => {
    fixture.detectChanges();

    component.form.patchValue({ letterCode: 'L001' });
    component.onRetrieve();

    expect(serviceSpy.retrieveLetterTemplate).toHaveBeenCalledWith('L001');
  });



  it('should generate letter', (done) => {
    fixture.detectChanges();

    component.form.patchValue({
      letterCode: 'L001',
      communicationType: 'MAIL',
      communicationCode: 'THK'
    });
    component.isRetrieved.set(true);
    component.letterText.set('Dear donor...');

    component.onGenerate();

    setTimeout(() => {
      expect(serviceSpy.generateLetter).toHaveBeenCalled();
      expect(component.isGenerated()).toBe(true);
      done();
    }, 100);
  });

  it('should not generate without retrieve', () => {
    fixture.detectChanges();

    component.onGenerate();

    expect(serviceSpy.generateLetter).not.toHaveBeenCalled();
    expect(snackbarSpy.showError).toHaveBeenCalled();
  });

  it('should save and print letter', (done) => {
    fixture.detectChanges();

    component.form.patchValue({
      letterCode: 'L001',
      communicationType: 'MAIL',
      communicationCode: 'THK'
    });
    component.isGenerated.set(true);

    component.onSaveAndPrint();

    setTimeout(() => {
      expect(serviceSpy.saveAndPrintLetter).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalled();
      done();
    }, 100);
  });




});
