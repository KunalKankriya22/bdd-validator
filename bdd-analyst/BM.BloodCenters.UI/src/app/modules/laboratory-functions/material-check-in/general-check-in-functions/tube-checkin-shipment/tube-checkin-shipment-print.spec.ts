import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TubeCheckinShipmentComponent } from './tube-checkin-shipment';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { TubeCheckinShipmentService } from './services/tube-checkin-shipment.service';
import { of, throwError } from 'rxjs';
import { SamplePackDto, SamplePackTubeDto } from './models/tube-checkin-shipment.model';

describe('TubeCheckinShipmentComponent - Print Functionality', () => {
  let component: TubeCheckinShipmentComponent;
  let fixture: ComponentFixture<TubeCheckinShipmentComponent>;
  let tubeCheckinService: jasmine.SpyObj<TubeCheckinShipmentService>;
  let matDialog: MatDialog;
  let matSnackBar: MatSnackBar;

  const mockBox: SamplePackDto = {
    boxId: 'CS616201',
    collDate: new Date('2026-06-10'),
    extractType: 'V',
    extractTypeDescription: 'Viral Marker',
    donorType: 'R',
    donorTypeDescription: 'Repeat',
    destinationCode: 'BRK',
    destinationName: 'Brooke Army Medical Center',
    status: 'Open',
    statusDescription: 'Open',
    chapterId: 'TEST_CHAPTER',
    boxClosedDate: null,
    boxClosedUser: null,
    insertDate: new Date('2026-06-10'),
    insertUser: 'TEST_USER',
    tubeCount: 1,
  };

  const mockTubes: SamplePackTubeDto[] = [
    {
      boxId: 'CS616201',
      unitId: '123456789',
      redTubeFlag: 'Y',
      purpleTubeFlag: null,
      purpleTube2Flag: null,
      insertDate: new Date('2026-06-10'),
      insertUser: 'TEST_USER',
      checkDigit: null,
    },
  ];

  beforeEach(() => {

    const mockHeaderService = {
      getCurrentChapterId: jasmine.createSpy('getCurrentChapterId').and.returnValue('TEST_CHAPTER'),
    };

    const mockPageHeaderService = {
      pageHeaderData: signal<any>(undefined),
    };

    const mockChapterTimezoneService = {
      getChapterLocalDate: jasmine.createSpy('getChapterLocalDate').and.returnValue({
        toDate: () => new Date(),
      }),
      isChapterLocalDateAvailable: jasmine.createSpy('isChapterLocalDateAvailable').and.returnValue(true),
    };

    tubeCheckinService = jasmine.createSpyObj('TubeCheckinShipmentService', [
      'getOpenBoxesDetailed',
      'getDestinationLabs',
      'getPlateCapacity',
      'getBoxUnits',
      'close',
    ]);

    // Setup default spy returns
    tubeCheckinService.getOpenBoxesDetailed.and.returnValue(of([]));
    tubeCheckinService.getDestinationLabs.and.returnValue(of([]));
    tubeCheckinService.getPlateCapacity.and.returnValue(of(88));
    tubeCheckinService.getBoxUnits.and.returnValue(of(mockTubes));
    tubeCheckinService.close.and.returnValue(of({ success: true, message: 'Box closed successfully', data: [], totalRecords: 0, statusCode: 200 }));



      TestBed.configureTestingModule({
      imports: [TubeCheckinShipmentComponent],
      providers: [
        provideHttpClient(),
        provideAnimationsAsync(),
        provideRouter([]),
        MatSnackBar,  // Provide the real service
        MatDialog,    // Provide the real service
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    })
    .overrideComponent(TubeCheckinShipmentComponent, {
      set: {
        providers: [
          { provide: TubeCheckinShipmentService, useValue: tubeCheckinService }
        ]
      }
    });


    


      tubeCheckinService.getOpenBoxesDetailed.calls.reset();


      tubeCheckinService.getDestinationLabs.calls.reset();


      tubeCheckinService.getPlateCapacity.calls.reset();


      tubeCheckinService.getBoxUnits.calls.reset();


      tubeCheckinService.close.calls.reset();


      tubeCheckinService.getOpenBoxesDetailed.and.returnValue(of([]));


      tubeCheckinService.getDestinationLabs.and.returnValue(of([]));


      tubeCheckinService.getPlateCapacity.and.returnValue(of(88));


      tubeCheckinService.getBoxUnits.and.returnValue(of(mockTubes));


      tubeCheckinService.close.and.returnValue(of({ success: true, message: 'Box closed successfully', data: [], totalRecords: 0, statusCode: 200 }));


    fixture = TestBed.createComponent(TubeCheckinShipmentComponent);
    component = fixture.componentInstance;
    matDialog = TestBed.inject(MatDialog);
    matSnackBar = TestBed.inject(MatSnackBar);
    fixture.detectChanges();


    });

  describe('onPrintPackList', () => {
    it('should show error when no box is selected', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      component.boxForm.patchValue({ boxId: null });

      component.onPrintPackList();

      expect(snackBarSpy).toHaveBeenCalledWith('Please select a box first', 'DISMISS', jasmine.any(Object));
    });

    it('should call service and print when box is valid', (done) => {
      const windowOpenSpy = spyOn(window, 'open').and.returnValue({
        document: { write: jasmine.createSpy(), close: jasmine.createSpy() },
        print: jasmine.createSpy(),
        onafterprint: null,
      } as any);
      component.boxForm.patchValue({ boxId: 'CS616201' });
      component.currentBox.set(mockBox);

      component.onPrintPackList();

      // Need to wait for the async observable to complete
      fixture.whenStable().then(() => {
        expect(tubeCheckinService.getBoxUnits).toHaveBeenCalledWith('CS616201', 'TEST_CHAPTER');
        expect(windowOpenSpy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('onCloseAndPrint', () => {
    it('should show error when no box is selected', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      component.boxForm.patchValue({ boxId: null });

      component.onCloseAndPrint();

      expect(snackBarSpy).toHaveBeenCalledWith('Please select a box first', 'DISMISS', jasmine.any(Object));
    });






  });

  describe('Helper Methods', () => {




    it('should map extract types correctly', () => {
      expect((component as any).getExtractTypeLabelForPrint('V')).toBe('Viral Marker');
      expect((component as any).getExtractTypeLabelForPrint('N')).toBe('NAT');
      expect((component as any).getExtractTypeLabelForPrint('B')).toBe('Both');
    });

    it('should map donor types correctly', () => {
      expect((component as any).getDonorTypeLabelForPrint('I')).toBe('First Time');
      expect((component as any).getDonorTypeLabelForPrint('R')).toBe('Repeat');
      expect((component as any).getDonorTypeLabelForPrint('O')).toBe('Others');
    });
  });

  describe('Print Window Generation', () => {
    it('should show error when popup is blocked', (done) => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      spyOn(window, 'open').and.returnValue(null);
      component.boxForm.patchValue({ boxId: 'CS616201' });
      component.currentBox.set(mockBox);

      component.onPrintPackList();

      setTimeout(() => {
        expect(snackBarSpy).toHaveBeenCalledWith('Please allow popups to print', 'DISMISS', jasmine.any(Object));
        done();
      }, 100);
    });

    it('should generate print content with box and tubes data', (done) => {
      const mockWindow = {
        document: { write: jasmine.createSpy(), close: jasmine.createSpy() },
        print: jasmine.createSpy(),
        onafterprint: null,
      };
      spyOn(window, 'open').and.returnValue(mockWindow as any);
      component.boxForm.patchValue({ boxId: 'CS616201' });
      component.currentBox.set(mockBox);

      component.onPrintPackList();

      setTimeout(() => {
        expect(mockWindow.document.write).toHaveBeenCalled();
        const printedContent = mockWindow.document.write.calls.first().args[0];
        expect(printedContent).toContain('CS616201');
        expect(printedContent).toContain('Viral Marker');
        done();
      }, 100);
    });
  });
});
