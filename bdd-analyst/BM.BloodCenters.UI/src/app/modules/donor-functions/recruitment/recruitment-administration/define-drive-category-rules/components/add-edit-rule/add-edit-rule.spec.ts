import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { AddEditRuleComponent } from './add-edit-rule';
import { DriveCategoryRulesService } from '../../services/drive-category-rules.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditRuleComponent', () => {
  let component: AddEditRuleComponent;
  let fixture: ComponentFixture<AddEditRuleComponent>;
  let mockService: jasmine.SpyObj<DriveCategoryRulesService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: any;

  const mockCategories = [
    { code: 'MOBILE', description: 'Mobile Blood Drive' },
    { code: 'FIXED', description: 'Fixed Site' }
  ];

  const mockRule = {
    ruleId: 'RULE001',
    driveCategory: 'MOBILE',
    description: 'Mobile Blood Drive',
    numberAllowed: 5,
    maxSize: 100,
    effDate: '2025-01-01',
    termDate: '2025-12-31',
    lastModifiedDate: '2025-03-01'
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DriveCategoryRulesService', [
      'getCategories',
      'getNextRuleId',
      'createDriveCategoryRule',
      'updateDriveCategoryRule'
    ]);
    mockService.getCategories.and.returnValue(of(mockCategories));
    mockService.getNextRuleId.and.returnValue(of('RULE002'));
    mockService.createDriveCategoryRule.and.returnValue(of({ success: true, message: 'Created' } as any));
    mockService.updateDriveCategoryRule.and.returnValue(of({ success: true, message: 'Updated' } as any));

    mockSnackBar = createMockMatSnackBar();

    mockHeaderService = {
      chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue('UTC')
    };



      TestBed.configureTestingModule({
      imports: [AddEditRuleComponent, NoopAnimationsModule],
      providers: [
        { provide: DriveCategoryRulesService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    


      mockService.getCategories.calls.reset();


      mockService.getNextRuleId.calls.reset();


      mockService.createDriveCategoryRule.calls.reset();


      mockService.updateDriveCategoryRule.calls.reset();


      mockService.getCategories.and.returnValue(of(mockCategories));


      mockService.getNextRuleId.and.returnValue(of('RULE002'));


      mockService.createDriveCategoryRule.and.returnValue(of({ success: true, message: 'Created' } as any));


      mockService.updateDriveCategoryRule.and.returnValue(of({ success: true, message: 'Updated' } as any));


    fixture = TestBed.createComponent(AddEditRuleComponent);
    component = fixture.componentInstance;


    });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });


    it('should load categories and next rule ID', () => {
      expect(mockService.getCategories).toHaveBeenCalled();
      expect(mockService.getNextRuleId).toHaveBeenCalled();
    });

    it('should set next rule ID in form', fakeAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();
      tick(100);

      expect(component.form.get('ruleId')?.value).toBe('RULE002');
    }));

    it('should auto-populate description when category changes', () => {
      component.categoryOptions = mockCategories;
      component.form.patchValue({ driveCategory: 'MOBILE' });

      expect(component.form.get('description')?.value).toBe('Mobile Blood Drive');
    });








  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockRule;
      fixture.detectChanges();
    });



    it('should keep category field editable in edit mode', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.get('driveCategory')?.disabled).toBe(false);
    });

    it('should update existing rule on save', () => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        numberAllowed: 10,
        maxSize: 150,
        effDate: moment().add(1, 'day'),
        termDate: moment().add(30, 'days')
      });

      component.onSave();

      expect(mockService.updateDriveCategoryRule).toHaveBeenCalledWith(
        'RULE001',
        'MOBILE',
        jasmine.any(Object)
      );
    });

    it('should show last modified text', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.panelSubtitle).toContain('Last Modified');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should allow drives to be optional', () => {
      const control = component.form.get('numberAllowed');
      control?.setValue(null);
      control?.markAsTouched();

      expect(control?.valid).toBe(true);
    });

    it('should allow size to be optional', () => {
      const control = component.form.get('maxSize');
      control?.setValue(null);
      control?.markAsTouched();

      expect(control?.valid).toBe(true);
    });


  });
});
