import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

import { CommentSidePanelComponent } from './comment-side-panel';
import { HealthHistoryDto } from '../../models/audit-donation.model';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { HeaderService } from '@shared/services/header.service';
import { Subject } from 'rxjs';

describe('CommentSidePanelComponent', () => {
  let component: CommentSidePanelComponent;
  let fixture: ComponentFixture<CommentSidePanelComponent>;

  const mockResponse: HealthHistoryDto = {
    transactionId: 'TXN001',
    questionCode: 'Q001',
    questionDescription: 'Test question',
    answerCode: 'YES',
    response: 'Y',
    comments: 'Existing comment',
    auditKey: 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommentSidePanelComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        TranslateModule.forRoot(),
      ],
    })
    .overrideComponent(CommentSidePanelComponent, {
      set: { providers: [{ provide: HeaderService, useValue: { chapterChanged$: new Subject<void>() } }] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommentSidePanelComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should initialize form with empty comments when no response provided', () => {
      component.response = null;
      fixture.detectChanges();

      expect(component.commentForm.get('comments')?.value).toBe('');
    });

    it('should initialize form with existing comments from response', () => {
      component.response = mockResponse;
      fixture.detectChanges();

      expect(component.commentForm.get('comments')?.value).toBe('Existing comment');
    });

    it('should have footer buttons defined', () => {
      fixture.detectChanges();
      expect(component.footerButtons.length).toBe(2);
      expect(component.footerButtons[0].action).toBe('cancel');
      expect(component.footerButtons[1].action).toBe('save');
    });
  });

  describe('getCharactersRemaining', () => {
    beforeEach(() => {
      component.response = mockResponse;
      fixture.detectChanges();
    });

    it('should return correct character count', () => {
      component.commentForm.patchValue({ comments: 'Hello' });

      expect(component.getCharactersRemaining()).toBe('5 / 240 characters');
    });

    it('should return 0 count when comments is empty', () => {
      component.commentForm.patchValue({ comments: '' });

      expect(component.getCharactersRemaining()).toBe('0 / 240 characters');
    });
  });


  describe('onButtonClick', () => {
    beforeEach(() => {
      component.response = {
        transactionId: 'TXN001',
        questionCode: 'Q001',
        questionDescription: 'Test question',
        answerCode: 'YES',
        response: 'Y',
        comments: 'Existing comment',
        auditKey: 1,
      };
      fixture.detectChanges();
    });

    it('should emit save with comments when action is save and form valid', () => {
      const saveSpy = spyOn(component.save, 'emit');
      component.commentForm.patchValue({ comments: 'New comment' });
      component.onButtonClick('save');
      expect(saveSpy).toHaveBeenCalledWith('New comment');
    });

    it('should not emit save when form is invalid', () => {
      const saveSpy = spyOn(component.save, 'emit');
      // Create a 241-char string to exceed maxLength
      component.commentForm.patchValue({ comments: 'x'.repeat(241) });
      component.onButtonClick('save');
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should emit cancel when action is cancel', () => {
      const cancelSpy = spyOn(component.cancel, 'emit');
      component.onButtonClick('cancel');
      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should emit cancel on unknown action', () => {
      const cancelSpy = spyOn(component.cancel, 'emit');
      component.onButtonClick('unknown');
      expect(cancelSpy).not.toHaveBeenCalled(); // only cancel/save handled
    });
  });

  describe('onClose', () => {
    it('should emit cancel', () => {
      fixture.detectChanges();
      const cancelSpy = spyOn(component.cancel, 'emit');
      component.onClose();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should emit cancel when chapter changes', () => {
      fixture.detectChanges();
      const cancelSpy = spyOn(component.cancel, 'emit');
      const headerService = fixture.debugElement.injector.get(HeaderService);
      (headerService.chapterChanged$ as any).next();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('getCharactersRemaining — null comments', () => {
    it('should handle null comments gracefully', () => {
      fixture.detectChanges();
      component.commentForm.patchValue({ comments: null });
      expect(component.getCharactersRemaining()).toBe('0 / 240 characters');
    });
  });

});