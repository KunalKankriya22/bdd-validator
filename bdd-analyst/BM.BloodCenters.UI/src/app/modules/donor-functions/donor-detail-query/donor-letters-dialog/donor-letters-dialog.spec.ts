import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { DonorLettersDialog, DonorLettersDialogData } from './donor-letters-dialog';
import { DonorDetailQueryService } from '../services/donor-detail-query.service';
import { DonorLetter } from '../models/donor-detail-query.model';

describe('DonorLettersDialog', () => {
  let component: DonorLettersDialog;
  let fixture: ComponentFixture<DonorLettersDialog>;
  let mockService: jasmine.SpyObj<DonorDetailQueryService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DonorLettersDialog>>;

  const mockData: DonorLettersDialogData = {
    donorId: '00008392',
    donorName: 'ROGERS, MARY',
  };

  const mockLetters: DonorLetter[] = [
    {
      letterCode: 'BIRTH',
      letterId: 'L001',
      documentType: 'Letter',
      generateDate: '2025-01-15',
      authorizedBy: 'ADMIN',
      letterTitle: 'Happy Birthday',
    },
    {
      letterCode: 'THANK',
      letterId: 'L002',
      documentType: 'Letter',
      generateDate: '2025-02-20',
      authorizedBy: 'SYSTEM',
      letterTitle: 'Thank You',
    },
  ];

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('DonorDetailQueryService', [
      'getDonorLetters',
      'formatDate',
    ]);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService.formatDate.and.callFake((d: string) => d);

    const mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant', 'get']);
    mockTranslateService.instant.and.returnValue('');
    mockTranslateService.get.and.returnValue(of(''));

    await TestBed.configureTestingModule({
      imports: [DonorLettersDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: DonorDetailQueryService, useValue: mockService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: TranslateService, useValue: mockTranslateService },
      ],
    }).compileComponents();
  });

  describe('with letters data', () => {
    beforeEach(() => {
      mockService.getDonorLetters.and.returnValue(of(mockLetters));
      fixture = TestBed.createComponent(DonorLettersDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load letters on init', () => {
      expect(mockService.getDonorLetters).toHaveBeenCalledWith('00008392');
      expect(component.letters()).toEqual(mockLetters);
      expect(component.hasLetters()).toBe(true);
      expect(component.loading()).toBe(false);
    });

    it('should close dialog when onClose is called', () => {
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should have correct table columns', () => {
      expect(component.tableConfig.columns.length).toBe(5);
      expect(component.tableConfig.columns[0].key).toBe('letterCode');
      expect(component.tableConfig.columns[1].key).toBe('letterTitle');
      expect(component.tableConfig.columns[2].key).toBe('documentType');
      expect(component.tableConfig.columns[3].key).toBe('generateDate');
      expect(component.tableConfig.columns[4].key).toBe('authorizedBy');
    });
  });

  describe('with empty data', () => {
    beforeEach(() => {
      mockService.getDonorLetters.and.returnValue(of([]));
      fixture = TestBed.createComponent(DonorLettersDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should show empty state when no letters', () => {
      expect(component.hasLetters()).toBe(false);
      expect(component.letters()).toEqual([]);
    });
  });

  describe('with error', () => {
    beforeEach(() => {
      mockService.getDonorLetters.and.returnValue(throwError(() => new Error('API error')));
      fixture = TestBed.createComponent(DonorLettersDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set error on API failure', () => {
      expect(component.error()).toBe('Failed to load letters. Please try again.');
      expect(component.loading()).toBe(false);
    });

    it('should retry loading on loadLetters call', () => {
      mockService.getDonorLetters.and.returnValue(of(mockLetters));
      component.loadLetters();
      expect(component.letters()).toEqual(mockLetters);
      expect(component.error()).toBeNull();
    });
  });

  describe('with missing donorId', () => {
    beforeEach(async () => {
      const mockTranslate = jasmine.createSpyObj('TranslateService', ['instant', 'get']);
      mockTranslate.instant.and.returnValue('');
      mockTranslate.get.and.returnValue(of(''));

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [DonorLettersDialog, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          { provide: DonorDetailQueryService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: { donorId: '' } },
          { provide: TranslateService, useValue: mockTranslate },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(DonorLettersDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set error when donorId is empty', () => {
      expect(component.error()).toBe('Donor ID is required');
      expect(mockService.getDonorLetters).not.toHaveBeenCalled();
    });
  });
});
