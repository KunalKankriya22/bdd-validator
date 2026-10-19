import { Injectable } from '@angular/core';
import { UppercaseMomentDateAdapter } from './uppercase-date-adapter';

/**
 * Custom date adapter that uses chapter timezone for determining "today".
 * Inherits today() from UppercaseMomentDateAdapter which reads
 * ChapterTimezoneService.getChapterLocalDate() — set directly from the API
 * response and more reliable than computing from a timezone string.
 */
@Injectable()
export class ChapterAwareDateAdapter extends UppercaseMomentDateAdapter {}
