import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject, NEVER } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import moment from 'moment';

import { DeliveryConfirmation } from './delivery-confirmation';
import { DeliveryConfirmationApiService } from './services/delivery-confirmation-api.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { HeaderService } from '../../../../shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  UndeliveredShipmentDto,
  ShipmentDeliveryDto,
} from './models/delivery-confirmation.model';
import {
  createMockRouter,
  createMockActivatedRoute,
} from '@shared/testing/page-header-service.mock';

describe('DeliveryConfirmation', () => {
  let placeholders: any;
  let hint: any;
  let buttons: any;
  let fieldValues: any;
  let callArgs: any;
  let message: any;
  let title: any;
  let confirmSubject: any;
  let pageHeaderServiceSpy: any;
  let component: DeliveryConfirmation;
  let fixture: ComponentFixture<DeliveryConfirmation>;
  let apiServiceSpy: jasmine.SpyObj<DeliveryConfirmationApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let chapterTimezoneSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let chapterChanged$: Subject<void>;

  const mockUndeliveredShipments: UndeliveredShipmentDto[] = [
    {
      shipmentNo: 'SH240001',
      shortName: 'HOSP-A',
      consigneeName: 'Hospital A - Main Campus',
    },
    {
      shipmentNo: 'SH240002',
      shortName: 'HOSP-B',
      consigneeName: 'Hospital B - Blood Bank',
    },
  ];

  const mockShipmentDetails: ShipmentDeliveryDto = {
    shipmentNo: 'SH240001',
    consigneeId: 'CONS001',
    consigneeShortName: 'HOSP-A',
    shipmentDate: '2024-01-15T09:30:00Z',
    shippedByPerson: 'John Smith',
    carrier: 'FedEx',
    trackNo: '1234567890',
    flightNo: 'QF9',
    receiptDate: null,
    receivedBy: null,
    comments: null,
    chapterId: 'CH01',
  };

  function fillFormForSubmission(): void {
    component.form.patchValue({
      shipmentNo: 'SH240001',
      receiptDate: new Date(),
      receivedBy: 'Jane Doe',
      comments: '',
    });
  }

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('DeliveryConfirmationApiService', [
      'getUndeliveredShipments',
      'getShipmentDetails',
      'confirmDelivery',
    ]);
    snackbarServiceSpy = createMockSnackbarService();

    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate', 'getChapterLocalDateTime'
    ]);
    chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));
    chapterTimezoneSpy.getChapterLocalDateTime.and.returnValue(moment());

    apiServiceSpy.getUndeliveredShipments.and.returnValue(
      of(mockUndeliveredShipments)
    );
    apiServiceSpy.getShipmentDetails.and.returnValue(of(mockShipmentDetails));
    apiServiceSpy.confirmDelivery.and.returnValue(of(true));

    pageHeaderServiceSpy = jasmine.createSpyObj(
      'PageHeaderService',
      ['getTitle', 'getSubtitle', 'getCurrentMenuItem'],
      { pageHeaderData: jasmine.createSpy().and.returnValue(undefined) }
    );

    const headerServiceSpy = createMockHeaderService();



      TestBed.configureTestingModule({
      imports: [DeliveryConfirmation, NoopAnimationsModule],
      providers: [
        { provide: DeliveryConfirmationApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy },
        { provide: Router, useValue: createMockRouter() },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
      ],
    });


      chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));


      chapterTimezoneSpy.getChapterLocalDateTime.and.returnValue(moment());


      apiServiceSpy.getShipmentDetails.and.returnValue(of(mockShipmentDetails));


      apiServiceSpy.confirmDelivery.and.returnValue(of(true));


    fixture = TestBed.createComponent(DeliveryConfirmation);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should initialize form with all controls', () => {
      fixture.detectChanges();
      expect(component.form.get('shipmentNo')).toBeTruthy();
      expect(component.form.get('receiptDate')).toBeTruthy();
      expect(component.form.get('receivedBy')).toBeTruthy();
      expect(component.form.get('comments')).toBeTruthy();
    });



    it('should load undelivered shipments on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getUndeliveredShipments).toHaveBeenCalled();
      expect(component['undeliveredShipments']()).toEqual(
        mockUndeliveredShipments
      );
    }));



    it('should populate filteredShipments after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component['filteredShipments']()).toEqual(
        mockUndeliveredShipments
      );
    }));
  });
  describe('Error State', () => {


    it('should use fallback error message when server provides none', fakeAsync(() => {
      apiServiceSpy.getUndeliveredShipments.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      fixture.detectChanges();
      tick();

      expect(component['error']()).toBe(
        'Failed to load undelivered shipments'
      );
    }));

    it('should show error on shipment details load failure', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const error = { error: { message: 'Server error' } };
      apiServiceSpy.getShipmentDetails.and.returnValue(
        throwError(() => error)
      );

      component.form.patchValue({ shipmentNo: 'SH240001' });
      tick();

      expect(component['error']()).toBe('Server error');
      expect(component['selectedShipment']()).toBeNull();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to load shipment details. Please try again.'
      );
    }));
  });

  describe('Shipment Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load shipment details when shipment selected', fakeAsync(() => {
      component.form.patchValue({ shipmentNo: 'SH240001' });
      tick();

      expect(apiServiceSpy.getShipmentDetails).toHaveBeenCalledWith(
        'SH240001'
      );
      expect(component['selectedShipment']()).toEqual(mockShipmentDetails);
    }));

    it('should clear selected shipment when no shipment selected', fakeAsync(() => {
      component.form.patchValue({ shipmentNo: 'SH240001' });
      tick();

      component.form.patchValue({ shipmentNo: null });
      tick();

      expect(component['selectedShipment']()).toBeNull();
    }));



    it('should patch comments from shipment details', fakeAsync(() => {
      const detailsWithComments: ShipmentDeliveryDto = {
        ...mockShipmentDetails,
        comments: 'Existing comment',
      };
      apiServiceSpy.getShipmentDetails.and.returnValue(
        of(detailsWithComments)
      );

      component.form.patchValue({ shipmentNo: 'SH240001' });
      tick();

      expect(component.form.get('comments')?.value).toBe('Existing comment');
    }));

    it('should set receiptDate to current date on shipment selection', fakeAsync(() => {
      component.form.patchValue({ shipmentNo: 'SH240001' });
      tick();

      expect(component.form.get('receiptDate')?.value).toBeTruthy();
      expect(component.form.get('receiptDate')?.value instanceof Date).toBeTrue();
    }));




  });

  describe('Shipment Search', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));





    it('should show all shipments when search cleared', fakeAsync(() => {
      component.shipmentSearchCtrl.setValue('SH240001');
      tick();

      component.shipmentSearchCtrl.setValue('');
      tick();

      expect(component['filteredShipments']().length).toBe(2);
    }));


  });

  describe('Empty State', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));



    it('should display correct empty state message', () => {
      title = fixture.debugElement.query(By.css('.empty-state-title'));
      expect(title.nativeElement.textContent).toContain(
        'No Results to Display'
      );

      message = fixture.debugElement.query(
        By.css('.empty-state-message')
      );
      expect(message.nativeElement.textContent).toContain(
        'Select a Shipment Number to begin.'
      );
    });

    it('should hide empty state when shipment selected', fakeAsync(() => {
      component.form.patchValue({ shipmentNo: 'SH240001' });
      tick();
      fixture.detectChanges();

      expect(component['showEmptyState']()).toBeFalse();

      const emptyState = fixture.debugElement.query(
        By.css('.empty-state-container')
      );
      expect(emptyState).toBeFalsy();
    }));


  });

  describe('Form Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should validate shipment number is required', () => {
      component.form.patchValue({ shipmentNo: null });
      expect(component.form.get('shipmentNo')?.hasError('required')).toBeTrue();
    });

    it('should validate receivedBy is required', () => {
      component.form.patchValue({ receivedBy: '' });
      expect(component.form.get('receivedBy')?.hasError('required')).toBeTrue();
    });

    it('should validate receivedBy max length (50)', () => {
      component.form.patchValue({ receivedBy: 'a'.repeat(51) });
      expect(
        component.form.get('receivedBy')?.hasError('maxlength')
      ).toBeTrue();
    });

    it('should validate comments max length (240)', () => {
      const longComment = 'a'.repeat(241);
      component.form.patchValue({ comments: longComment });
      expect(component.form.get('comments')?.hasError('maxlength')).toBeTrue();
    });

    it('should accept comments within max length', () => {
      component.form.patchValue({ comments: 'a'.repeat(240) });
      expect(
        component.form.get('comments')?.hasError('maxlength')
      ).toBeFalse();
    });




  });

  describe('Form Submission', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.form.patchValue({ shipmentNo: 'SH240001' });
      tick();
      component.form.patchValue({ receivedBy: 'Jane Doe' });
    }));





    it('should send correct request payload', fakeAsync(() => {
      component.form.patchValue({ comments: 'Test comment' });
      component.onSubmit();
      tick();

      callArgs = apiServiceSpy.confirmDelivery.calls.mostRecent().args[0];
      expect(callArgs.shipmentNo).toBe('SH240001');
      expect(callArgs.receiptDate).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00$/);
      expect(callArgs.receiptTime).toMatch(/^\d{2}:\d{2}:00$/);
      expect(callArgs.receivedBy).toBe('Jane Doe');
      expect(callArgs.comments).toBe('Test comment');
    }));



    it('should clear form after successful submission', fakeAsync(() => {
      component.onSubmit();
      tick();

      expect(component.form.get('shipmentNo')?.value).toBeNull();
      expect(component['selectedShipment']()).toBeNull();
      expect(component['submitted']()).toBeFalse();
    }));





    it('should use fallback error message when server provides none', fakeAsync(() => {
      apiServiceSpy.confirmDelivery.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      component.onSubmit();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to confirm delivery. Please try again.'
      );
    }));

    it('should set submitting state during submission', fakeAsync(() => {
      confirmSubject = new Subject<boolean>();
      apiServiceSpy.confirmDelivery.and.returnValue(
        confirmSubject.asObservable()
      );

      component.onSubmit();
      tick();

      expect(component['submitting']()).toBeTrue();

      confirmSubject.next(true);
      confirmSubject.complete();
      tick();

      expect(component['submitting']()).toBeFalse();
    }));







    it('should use empty string for receivedBy when field is whitespace only', fakeAsync(() => {
      component.form.patchValue({ receivedBy: '   ' });
      component.onSubmit();
      tick();

      callArgs = apiServiceSpy.confirmDelivery.calls.mostRecent().args[0];
      expect(callArgs.receivedBy).toBe('');
    }));
  });

  describe('Cancel Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should reset submitted state on cancel', () => {
      component['submitted'].set(true);

      component.onCancel();

      expect(component['submitted']()).toBeFalse();
    });

    it('should clear error on cancel', () => {
      component['error'].set('Some error');

      component.onCancel();

      expect(component['error']()).toBeNull();
    });
  });





  describe('Computed Properties', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should compute hasShipments correctly', () => {
      expect(component['hasShipments']()).toBeTrue();

      component['undeliveredShipments'].set([]);
      expect(component['hasShipments']()).toBeFalse();
    });

    it('should compute hasSelectedShipment correctly', () => {
      expect(component['hasSelectedShipment']()).toBeFalse();

      component['selectedShipment'].set(mockShipmentDetails);
      expect(component['hasSelectedShipment']()).toBeTrue();
    });

    it('should compute showEmptyState correctly', () => {
      expect(component['showEmptyState']()).toBeTrue();

      component['selectedShipment'].set(mockShipmentDetails);
      expect(component['showEmptyState']()).toBeFalse();

      component['selectedShipment'].set(null);
      component['loading'].set(true);
      expect(component['showEmptyState']()).toBeFalse();
    });
  });

  describe('Template Rendering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));



    it('should display shipment details when shipment selected', fakeAsync(() => {
      component.form.patchValue({ shipmentNo: 'SH240001' });
      tick();
      fixture.detectChanges();

      fieldValues = fixture.debugElement.queryAll(
        By.css('.delivery-confirmation__field-value')
      );
      const texts = fieldValues.map((el) =>
        el.nativeElement.textContent.trim()
      );

      expect(texts).toContain('CONS001');
      expect(texts).toContain('HOSP-A');
      expect(texts).toContain('John Smith');
      expect(texts).toContain('FedEx');
      expect(texts).toContain('1234567890');
      expect(texts).toContain('QF9');
    }));

    it('should show dash for null shipment detail fields', () => {
      fieldValues = fixture.debugElement.queryAll(
        By.css('.delivery-confirmation__field-value')
      );
      const texts = fieldValues.map((el) =>
        el.nativeElement.textContent.trim()
      );

      expect(texts).toContain('-');
    });

    it('should show action buttons when shipment selected', fakeAsync(() => {
      component.form.patchValue({ shipmentNo: 'SH240001' });
      tick();
      fixture.detectChanges();

      buttons = fixture.debugElement.queryAll(By.css('button'));
      const buttonTexts = buttons.map((b) =>
        b.nativeElement.textContent.trim()
      );

      expect(buttonTexts).toContain('CANCEL');
      expect(buttonTexts).toContain('SAVE');
    }));









    it('should show character count for comments', fakeAsync(() => {
      component.form.patchValue({ shipmentNo: 'SH240001' });
      tick();
      fixture.detectChanges();

      hint = fixture.debugElement.query(By.css('mat-hint'));
      expect(hint.nativeElement.textContent).toContain('/240');
    }));

    it('should show received date/time placeholders when no shipment selected', () => {
      placeholders = fixture.debugElement.queryAll(
        By.css('.delivery-confirmation__placeholder-text')
      );
      const texts = placeholders.map((p) =>
        p.nativeElement.textContent.trim()
      );

      expect(texts).toContain('Received Date/Time');
      expect(texts).toContain('Received By');
    });




  });


});
