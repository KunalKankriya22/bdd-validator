import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ConsentDetailDialogComponent } from './consent-detail-dialog.component';
import { ConsentHistoryService } from '../../services/consent-history.service';
import {
  ConsentHistoryDetailDto,
  ConsentDetailDialogData,
} from '../../models/consent-history.model';

describe('ConsentDetailDialogComponent', () => {
  let component: ConsentDetailDialogComponent;
  let fixture: ComponentFixture<ConsentDetailDialogComponent>;
  let mockService: jasmine.SpyObj<ConsentHistoryService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ConsentDetailDialogComponent>>;
  let mockSanitizer: jasmine.SpyObj<DomSanitizer>;

  const mockDialogData: ConsentDetailDialogData = {
    donorId: 'DON001',
    transactionId: 'TXN001',
    letterId: 'LTR001',
  };

  const mockDetail: ConsentHistoryDetailDto = {
    letterContent: 'I hereby consent to the donation.',
    letterCode: 'LC01',
    chapterId: 'CH01',
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ConsentHistoryService', [
      'getConsentDetail',
      'getSignature',
      'getSignatureUrl',
    ]);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSanitizer = jasmine.createSpyObj('DomSanitizer', [
      'bypassSecurityTrustUrl',
    ]);
    mockSanitizer.bypassSecurityTrustUrl.and.callFake(
      (url: string) => ({ changingThisBreaksApplicationSecurity: url } as any)
    );

    mockService.getConsentDetail.and.returnValue(of(mockDetail));
    mockService.getSignature.and.returnValue(of(new Blob()));



      TestBed.configureTestingModule({
      imports: [ConsentDetailDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: ConsentHistoryService, useValue: mockService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: DomSanitizer, useValue: mockSanitizer },
      ],
    });


    


      mockService.getConsentDetail.calls.reset();


      mockService.getSignature.calls.reset();


      mockService.getSignatureUrl.calls.reset();


      mockDialogRef.close.calls.reset();


      mockSanitizer.bypassSecurityTrustUrl.calls.reset();


      mockSanitizer.bypassSecurityTrustUrl.and.callFake(


      mockService.getConsentDetail.and.returnValue(of(mockDetail));


      mockService.getSignature.and.returnValue(of(new Blob()));


    fixture = TestBed.createComponent(ConsentDetailDialogComponent);
    component = fixture.componentInstance;


    });




  describe('Initialization', () => {
    it('should start in loading state', () => {
      expect(component.loading()).toBeTrue();
    });

    it('should have no error initially', () => {
      expect(component.error()).toBeNull();
    });

    it('should have no consent detail initially', () => {
      expect(component.consentDetail()).toBeNull();
    });

    it('should have no signature URLs initially', () => {
      expect(component.donorSignatureUrl()).toBeNull();
      expect(component.witnessSignatureUrl()).toBeNull();
    });
  });

  describe('loadConsentDetail (ngOnInit)', () => {
    it('should call getConsentDetail with correct params on init', () => {
      fixture.detectChanges();

      expect(mockService.getConsentDetail).toHaveBeenCalledWith(
        'DON001',
        'TXN001',
        'LTR001'
      );
    });

    it('should set consent detail and stop loading on success', () => {
      fixture.detectChanges();

      expect(component.consentDetail()).toEqual(mockDetail);
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeNull();
    });

    it('should load signatures after consent detail loads', () => {
      fixture.detectChanges();

      expect(mockService.getSignature).toHaveBeenCalledWith(
        'DON001',
        'TXN001',
        'LTR001',
        'donor'
      );
      expect(mockService.getSignature).toHaveBeenCalledWith(
        'DON001',
        'TXN001',
        'LTR001',
        'witness'
      );
    });

    it('should set error and stop loading on API failure', () => {
      mockService.getConsentDetail.and.returnValue(
        throwError(() => ({ message: 'Server error' }))
      );

      fixture.detectChanges();

      expect(component.error()).toBe('Server error');
      expect(component.loading()).toBeFalse();
      expect(component.consentDetail()).toBeNull();
    });

    it('should use fallback message when error has no message', () => {
      mockService.getConsentDetail.and.returnValue(
        throwError(() => ({}))
      );

      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load consent details');
    });


  });

  describe('loadSignatures', () => {
    it('should set donor signature URL when blob has content', () => {
      const blob = new Blob(['image-data'], { type: 'image/jpeg' });
      mockService.getSignature.and.callFake((_d, _t, _l, type) => {
        if (type === 'donor') return of(blob);
        return of(new Blob());
      });

      fixture.detectChanges();

      expect(component.donorSignatureUrl()).toBeTruthy();
      expect(mockSanitizer.bypassSecurityTrustUrl).toHaveBeenCalled();
    });

    it('should track raw donor URL for revocation', () => {
      const blob = new Blob(['image-data'], { type: 'image/jpeg' });
      mockService.getSignature.and.callFake((_d, _t, _l, type) => {
        if (type === 'donor') return of(blob);
        return of(new Blob());
      });

      fixture.detectChanges();

      expect((component as any).donorRawUrl).toBeTruthy();
      expect(typeof (component as any).donorRawUrl).toBe('string');
    });

    it('should track raw witness URL for revocation', () => {
      const blob = new Blob(['witness-data'], { type: 'image/jpeg' });
      mockService.getSignature.and.callFake((_d, _t, _l, type) => {
        if (type === 'witness') return of(blob);
        return of(new Blob());
      });

      fixture.detectChanges();

      expect((component as any).witnessRawUrl).toBeTruthy();
      expect(typeof (component as any).witnessRawUrl).toBe('string');
    });

    it('should set witness signature URL when blob has content', () => {
      const blob = new Blob(['witness-data'], { type: 'image/jpeg' });
      mockService.getSignature.and.callFake((_d, _t, _l, type) => {
        if (type === 'witness') return of(blob);
        return of(new Blob());
      });

      fixture.detectChanges();

      expect(component.witnessSignatureUrl()).toBeTruthy();
    });

    it('should not set signature URL when blob is empty', () => {
      const emptyBlob = new Blob([], { type: 'image/jpeg' });
      mockService.getSignature.and.returnValue(of(emptyBlob));

      fixture.detectChanges();

      expect(component.donorSignatureUrl()).toBeNull();
      expect(component.witnessSignatureUrl()).toBeNull();
    });

    it('should not throw on signature fetch error', () => {
      mockService.getSignature.and.returnValue(
        throwError(() => new Error('Not found'))
      );

      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.donorSignatureUrl()).toBeNull();
      expect(component.witnessSignatureUrl()).toBeNull();
    });
  });
  describe('onRetry', () => {
    it('should reload consent detail on retry', () => {
      fixture.detectChanges();

      mockService.getConsentDetail.calls.reset();
      mockService.getSignature.calls.reset();

      mockService.getConsentDetail.and.returnValue(of(mockDetail));
      mockService.getSignature.and.returnValue(of(new Blob()));

      component.onRetry();

      expect(mockService.getConsentDetail).toHaveBeenCalledWith(
        'DON001',
        'TXN001',
        'LTR001'
      );
    });

    it('should revoke and clear raw URLs before retrying', () => {
      const revokeSpy = spyOn(URL, 'revokeObjectURL');
      (component as any).donorRawUrl = 'blob:http://localhost/old-donor';
      (component as any).witnessRawUrl = 'blob:http://localhost/old-witness';
      component.donorSignatureUrl.set({ fake: 'url' } as any);
      component.witnessSignatureUrl.set({ fake: 'url' } as any);

      mockService.getConsentDetail.and.returnValue(of(mockDetail));
      mockService.getSignature.and.returnValue(of(new Blob()));

      component.onRetry();

      expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/old-donor');
      expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/old-witness');
      expect((component as any).donorRawUrl).toBeNull();
      expect((component as any).witnessRawUrl).toBeNull();
      expect(mockService.getConsentDetail).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {


    it('should revoke raw object URLs on destroy', () => {
      const revokeSpy = spyOn(URL, 'revokeObjectURL');
      (component as any).donorRawUrl = 'blob:http://localhost/donor-123';
      (component as any).witnessRawUrl = 'blob:http://localhost/witness-456';

      component.ngOnDestroy();

      expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/donor-123');
      expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/witness-456');
    });

    it('should null out raw URLs after revocation', () => {
      spyOn(URL, 'revokeObjectURL');
      (component as any).donorRawUrl = 'blob:http://localhost/donor-123';
      (component as any).witnessRawUrl = 'blob:http://localhost/witness-456';

      component.ngOnDestroy();

      expect((component as any).donorRawUrl).toBeNull();
      expect((component as any).witnessRawUrl).toBeNull();
    });


  });

  describe('Template rendering', () => {






    it('should show consent content when detail is loaded', () => {
      fixture.detectChanges();

      const letterText = fixture.nativeElement.querySelector('.letter-text');
      expect(letterText?.textContent).toContain(
        'I hereby consent to the donation.'
      );
    });
  });
});
