import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of, EMPTY } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import moment from 'moment';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  ApiResponse,
  AuditDonationDto,
  HealthHistoryDto,
  HHTemplateQuestionDto,
  AddHealthHistoryResponseRequest,
  UpdateHealthHistoryRequest,
  PhysicalFindingDto,
  PhysicalFindingTemplateDto,
  PhysicalValueRulesDto,
  HoldInterCodeDto,
  AddPhysicalFindingRequest,
  UpdatePhysicalFindingRequest,
  DonationInterdictionDto,
  AddInterdictionRequest,
  AddQuestionToTemplateRequest,
  SaveDonationAuditRequest,
  HHQuestionListDto,
  DropdownOption,
  AnswerCodeOption,
} from '../models/audit-donation.model';

export interface UnitValidationResult {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
  parsedUnitId?: string;
  manualUnitId?: string;
  entryMode?: string;
  barcodeType?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditDonationApiService {
  private readonly apiService = inject(ApiService);

  getDonation(unitId: string, collectionDate?: string): Observable<AuditDonationDto> {
    let url = API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_DONATION(unitId);
    if (collectionDate) url += `?collectionDate=${encodeURIComponent(collectionDate)}`;
    return this.apiService.get<ApiResponse<AuditDonationDto[] | AuditDonationDto>>(url).pipe(
      switchMap((response) => {
        const data = response.data;
        if (Array.isArray(data)) {
          if (data.length === 0) return throwError(() => ({ status: 404, error: { message: 'Err1230 - No donation found' } }));
          if (data.length > 1 && !collectionDate) {
            return throwError(() => ({ status: 300, code: 'MULTIPLE_RECORDS' }));
          }
          if (data.length > 1 && collectionDate) {
            const match = data.find(d =>
              d.collectionDate && moment(d.collectionDate as string).format('YYYY-MM-DD') === collectionDate
            );
            return of(match ?? data[0]);
          }
          return of(data[0]);
        }
        return of(data);
      }),
      catchError((error) => throwError(() => error))
    );
  }

  getDonationByDeferralId(deferralId: string, collectionDate?: string): Observable<AuditDonationDto> {
    let url = API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_DONATION_BY_DEFERRAL(deferralId);
    if (collectionDate) {
      url += `?collectionDate=${encodeURIComponent(collectionDate)}`;
    }
    return this.apiService.get<ApiResponse<AuditDonationDto[] | AuditDonationDto>>(url).pipe(
      switchMap((response) => {
        const data = response.data;
        if (Array.isArray(data)) {
          if (data.length === 0) return throwError(() => ({ status: 404, error: { message: 'Deferral not found' } }));
          if (data.length > 1 && !collectionDate) {
            return throwError(() => ({ status: 300, error: { message: 'MULTIPLE_RECORDS' } }));
          }
          if (data.length > 1 && collectionDate) {
            const match = data.find(d =>
              d.collectionDate && moment(d.collectionDate as string).format('YYYY-MM-DD') === collectionDate
            );
            return of(match ?? data[0]);
          }
          return of(data[0]);
        }
        return of(data);
      }),
      catchError((error) => throwError(() => error))
    );
  }

  getHealthHistory(unitId: string, collectionDate?: string, transactionId?: string): Observable<HealthHistoryDto[]> {
    const params: string[] = [];
    if (collectionDate) params.push(`collectionDate=${encodeURIComponent(collectionDate)}`);
    if (transactionId) params.push(`transactionId=${encodeURIComponent(transactionId)}`);
    const url = API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_HEALTH_HISTORY(unitId) + (params.length ? '?' + params.join('&') : '');
    return this.apiService.get<ApiResponse<HealthHistoryDto[]>>(url).pipe(
      map((response) => response.data.map(item => ({
        ...item,
        deferralThrough: item.defThruDate,
        interdiction: item.interCode,
        interPeriodType: item.interPeriodType,
      }))),
      catchError((error) => throwError(() => error))
    );
  }

  addHealthHistoryResponse(unitId: string, response: AddHealthHistoryResponseRequest, transactionId?: string): Observable<HealthHistoryDto> {
    const url = API.DONOR_FUNCTIONS.AUDIT_DONATION.ADD_HEALTH_HISTORY_RESPONSE(unitId)
      + (transactionId ? `?transactionId=${encodeURIComponent(transactionId)}` : '');
    return this.apiService
      .post<ApiResponse<HealthHistoryDto[]>>(url, response)
      .pipe(
        map((r) => {
          const item = Array.isArray(r.data) ? r.data[0] : r.data;
          return { ...item, deferralThrough: item?.defThruDate, interdiction: item?.interCode };
        }),
        catchError((error) => throwError(() => error))
      );
  }

  updateHealthHistory(unitId: string, healthHistory: UpdateHealthHistoryRequest[], transactionId?: string): Observable<void> {
    const url = API.DONOR_FUNCTIONS.AUDIT_DONATION.UPDATE_HEALTH_HISTORY(unitId)
      + (transactionId ? `?transactionId=${encodeURIComponent(transactionId)}` : '');
    return this.apiService
      .put<ApiResponse<void>>(url, healthHistory)
      .pipe(
        map(() => undefined),
        catchError((error) => throwError(() => error))
      );
  }

  deleteHealthHistory(unitId: string, questionCode: string, auditKey: number, transactionId?: string): Observable<void> {
    const base = API.DONOR_FUNCTIONS.AUDIT_DONATION.DELETE_HEALTH_HISTORY(unitId, questionCode, auditKey);
    const url = base + (transactionId ? `?transactionId=${encodeURIComponent(transactionId)}` : '');
    return this.apiService
      .delete<ApiResponse<void>>(url)
      .pipe(
        map(() => undefined),
        catchError((error) => throwError(() => error))
      );
  }

  getPhysicalFindings(unitId: string, collectionDate?: string, transactionId?: string): Observable<PhysicalFindingDto[]> {
    const params: string[] = [];
    if (collectionDate) params.push(`collectionDate=${encodeURIComponent(collectionDate)}`);
    if (transactionId) params.push(`transactionId=${encodeURIComponent(transactionId)}`);
    const url = API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_PHYSICAL_FINDINGS(unitId) + (params.length ? '?' + params.join('&') : '');
    return this.apiService.get<ApiResponse<any[]>>(url).pipe(
      map((response) => response.data.map((item: any) => ({
        transactionId:       item.transactionId,
        physicalCode:        item.physicalCode,
        physicalDescription: item.codeDescription ?? item.physicalDescription ?? item.description ?? '',
        description:         item.codeDescription ?? item.physicalDescription ?? item.description ?? '',
        value:               item.physicalValue   ?? item.value               ?? '',
        interdiction:        item.interCode       ?? item.interdiction        ?? '',
        interDescription:    item.interDescription ?? '',
        comments:            item.comments        ?? '',
        auditKey:            item.auditKey,
      } as PhysicalFindingDto))),
      catchError((error) => throwError(() => error))
    );
  }

  addPhysicalFinding(unitId: string, request: AddPhysicalFindingRequest, transactionId?: string): Observable<void> {
    const url = API.DONOR_FUNCTIONS.AUDIT_DONATION.ADD_PHYSICAL_FINDING(unitId)
      + (transactionId ? `?transactionId=${encodeURIComponent(transactionId)}` : '');
    return this.apiService
      .post<ApiResponse<void>>(url, request)
      .pipe(
        map(() => undefined),
        catchError((error) => throwError(() => error))
      );
  }

  deletePhysicalFinding(unitId: string, physicalCode: string, transactionId?: string): Observable<void> {
    const base = API.DONOR_FUNCTIONS.AUDIT_DONATION.DELETE_PHYSICAL_FINDING(unitId, physicalCode);
    const url = base + (transactionId ? `?transactionId=${encodeURIComponent(transactionId)}` : '');
    return this.apiService
      .delete<ApiResponse<void>>(url)
      .pipe(map(() => undefined), catchError((error) => throwError(() => error)));
  }

  updatePhysicalFindings(unitId: string, findings: UpdatePhysicalFindingRequest[], transactionId?: string): Observable<void> {
    const url = API.DONOR_FUNCTIONS.AUDIT_DONATION.UPDATE_PHYSICAL_FINDINGS(unitId)
      + (transactionId ? `?transactionId=${encodeURIComponent(transactionId)}` : '');
    return this.apiService
      .put<ApiResponse<void>>(url, findings)
      .pipe(
        map(() => undefined),
        catchError((error) => throwError(() => error))
      );
  }

  getInterdictions(unitId: string, collectionDate?: string, transactionId?: string): Observable<DonationInterdictionDto[]> {
    const params: string[] = [];
    if (collectionDate) params.push(`collectionDate=${encodeURIComponent(collectionDate)}`);
    if (transactionId) params.push(`transactionId=${encodeURIComponent(transactionId)}`);
    const url = API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_INTERDICTIONS(unitId) + (params.length ? '?' + params.join('&') : '');
    return this.apiService.get<ApiResponse<DonationInterdictionDto[]>>(url).pipe(
      map((response) => response.data.map((item: any) => ({
        ...item,
        interDescription: item.interDescription || item.inter_description ||
          item.description || item.interdictionDescription || '',
      }))),
      catchError((error) => throwError(() => error))
    );
  }

  addInterdiction(unitId: string, interdiction: AddInterdictionRequest, transactionId?: string): Observable<void> {
    const url = API.DONOR_FUNCTIONS.AUDIT_DONATION.ADD_INTERDICTION(unitId)
      + (transactionId ? `?transactionId=${encodeURIComponent(transactionId)}` : '');
    return this.apiService
      .post<ApiResponse<void>>(url, interdiction)
      .pipe(
        map(() => undefined),
        catchError((error) => throwError(() => error))
      );
  }

  removeInterdiction(unitId: string, interCode: string, transactionId?: string): Observable<void> {
    const base = API.DONOR_FUNCTIONS.AUDIT_DONATION.REMOVE_INTERDICTION(unitId, interCode);
    const url = base + (transactionId ? `?transactionId=${encodeURIComponent(transactionId)}` : '');
    return this.apiService
      .delete<ApiResponse<void>>(url)
      .pipe(
        map(() => undefined),
        catchError((error) => throwError(() => error))
      );
  }

  getHHTemplate(donationType: string, collectionDate?: string, transactionId?: string, donorId?: string): Observable<HHTemplateQuestionDto[]> {
    return this.apiService
      .get<ApiResponse<HHTemplateQuestionDto[]>>(API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_HH_TEMPLATE(donationType, collectionDate, transactionId, donorId))
      .pipe(
        map((response) => [...(response.data ?? [])].sort((a, b) => a.sortSequence - b.sortSequence)),
        catchError((error) => throwError(() => error))
      );
  }

  addQuestionToTemplate(request: AddQuestionToTemplateRequest): Observable<HHTemplateQuestionDto[]> {
    return this.apiService
      .post<ApiResponse<HHTemplateQuestionDto[]>>(API.DONOR_FUNCTIONS.AUDIT_DONATION.ADD_QUESTION_TO_TEMPLATE, request)
      .pipe(
        map((response) => [...(response.data ?? [])].sort((a, b) => a.sortSequence - b.sortSequence)),
        catchError((error) => throwError(() => error))
      );
  }

  deleteQuestionFromTemplate(questionCode: string, donationType: string): Observable<void> {
    return this.apiService
      .delete<ApiResponse<void>>(API.DONOR_FUNCTIONS.AUDIT_DONATION.DELETE_QUESTION_FROM_TEMPLATE(questionCode, donationType))
      .pipe(
        map(() => undefined),
        catchError((error) => throwError(() => error))
      );
  }

  placeHold(unitId: string, transactionId: string, interCode: string, overrideTxId?: string): Observable<void> {
    const url = API.DONOR_FUNCTIONS.AUDIT_DONATION.PLACE_HOLD(unitId)
      + (overrideTxId ? `?transactionId=${encodeURIComponent(overrideTxId)}` : '');
    return this.apiService
      .post<ApiResponse<void>>(url, { transactionId, interCode })
      .pipe(
        map(() => undefined),
        catchError((error) => throwError(() => error))
      );
  }

  getPhysicalValueRules(unitId: string, collectionDate?: string, transactionId?: string): Observable<PhysicalValueRulesDto[]> {
    const params: string[] = [];
    if (collectionDate) params.push(`collectionDate=${encodeURIComponent(collectionDate)}`);
    if (transactionId) params.push(`transactionId=${encodeURIComponent(transactionId)}`);
    const url = API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_PF_VALUE_RULES(unitId) + (params.length ? '?' + params.join('&') : '');
    return this.apiService.get<ApiResponse<any>>(url).pipe(
      map((r) => (r.data ?? []) as PhysicalValueRulesDto[]),
      catchError(() => of([]))
    );
  }

  getPhysicalFindingsTemplate(unitId: string, collectionDate?: string, transactionId?: string): Observable<PhysicalFindingTemplateDto[]> {
    const params: string[] = [];
    if (collectionDate) params.push(`collectionDate=${encodeURIComponent(collectionDate)}`);
    if (transactionId) params.push(`transactionId=${encodeURIComponent(transactionId)}`);
    const url = API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_PF_TEMPLATE(unitId) + (params.length ? '?' + params.join('&') : '');
    return this.apiService.get<ApiResponse<any>>(url).pipe(
      map((r) => (r.data ?? []) as PhysicalFindingTemplateDto[]),
      catchError(() => of([]))
    );
  }

  getHoldCodes(): Observable<HoldInterCodeDto[]> {
    return this.apiService.get<ApiResponse<HoldInterCodeDto[]>>(API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_HOLD_CODES).pipe(
      map((r) => r.data ?? []),
      catchError(() => of([]))
    );
  }

  // MLT-10698: PRTYP period type day-multipliers for def_thru_date calculation
  getPeriodTypeMultipliers(): Observable<Map<string, number>> {
    return this.apiService.get<ApiResponse<{ periodType: string; numeralValue: number }[]>>(
      API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_PERIOD_TYPE_MULTIPLIERS
    ).pipe(
      map((r) => {
        const m = new Map<string, number>();
        (r.data ?? []).forEach((item) => { const v = Number(item.numeralValue); if (v > 0) m.set((item.periodType ?? '').toUpperCase(), v); });
        return m;
      }),
      catchError(() => of(new Map<string, number>()))
    );
  }

  getNodosignCode(): Observable<string | null> {
    return this.apiService.get<ApiResponse<any>>(API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_NODOSIGN_CODE).pipe(
      map((r) => {
        const d = r.data;
        if (Array.isArray(d)) return d[0] ?? null;
        return typeof d === 'string' ? d : null;
      }),
      catchError(() => of(null))
    );
  }

  getNodonationCode(): Observable<string | null> {
    return this.apiService.get<ApiResponse<any>>(API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_NODONATION_CODE).pipe(
      map((r) => {
        const d = r.data;
        if (Array.isArray(d)) return d[0] ?? null;
        return typeof d === 'string' ? d : null;
      }),
      catchError(() => of(null))
    );
  }

  getNoprocedurCode(): Observable<string | null> {
    return this.apiService.get<ApiResponse<any>>(API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_NOPROCEDUR_CODE).pipe(
      map((r) => {
        const d = r.data;
        if (Array.isArray(d)) return d[0] ?? null;
        return typeof d === 'string' ? d : null;
      }),
      catchError(() => of(null))
    );
  }

  validateHhCommentCode(questionCode: string, answerCode: string, responseCode: string, commentCode: string): Observable<{ valid: boolean; data: string | null }> {
    const params = `?questionCode=${encodeURIComponent(questionCode)}&answerCode=${encodeURIComponent(answerCode)}&responseCode=${encodeURIComponent(responseCode)}&commentCode=${encodeURIComponent(commentCode)}`;
    return this.apiService.get<any>(API.DONOR_FUNCTIONS.AUDIT_DONATION.VALIDATE_HH_COMMENT + params).pipe(
      map((r: any) => ({ valid: r.valid === true, data: r.data ?? null })),
      catchError(() => of({ valid: false, data: null }))
    );
  }

  validatePfCommentCode(commentCode: string): Observable<{ valid: boolean; data: string | null }> {
    const params = `?commentCode=${encodeURIComponent(commentCode)}`;
    return this.apiService.get<any>(API.DONOR_FUNCTIONS.AUDIT_DONATION.VALIDATE_PF_COMMENT + params).pipe(
      map((r: any) => ({ valid: r.valid === true, data: r.data ?? null })),
      catchError(() => of({ valid: false, data: null }))
    );
  }

  getPfWeightCode(): Observable<string | null> {
    return this.apiService.get<ApiResponse<any>>(API.DONOR_FUNCTIONS.AUDIT_DONATION.GET_PF_WEIGHT_CODE).pipe(
      map((r) => {
        const d = r.data;
        // BE returns Data as List<string> → JSON is ["WEIGHT"], not "WEIGHT"
        if (Array.isArray(d)) return d[0] ?? null;
        return typeof d === 'string' ? d : null;
      }),
      catchError(() => of(null))
    );
  }

  saveDonationAudit(unitId: string, request: SaveDonationAuditRequest, transactionId?: string): Observable<{ message: string; data: AuditDonationDto }> {
    const url = API.DONOR_FUNCTIONS.AUDIT_DONATION.SAVE_DONATION_AUDIT(unitId)
      + (transactionId ? `?transactionId=${encodeURIComponent(transactionId)}` : '');
    return this.apiService
      .put<ApiResponse<AuditDonationDto[]>>(url, request)
      .pipe(
        map((response) => ({
          message: response.message ?? 'Audit saved successfully.',
          data: Array.isArray(response.data) ? response.data[0] : response.data,
        })),
        catchError((error) => throwError(() => error))
      );
  }

  getGroupCodes(questionCode?: string, response?: string | null): Observable<DropdownOption[]> {
    let url = API.HEALTH_HISTORY_ANSWERS.GROUP_CODES;
    const params: string[] = [];
    if (questionCode) params.push(`questionCode=${encodeURIComponent(questionCode)}`);
    if (response)     params.push(`response=${encodeURIComponent(response)}`);
    if (params.length) url += '?' + params.join('&');
    return this.apiService
      .get<ApiResponse<{ code: string; description?: string }[]>>(url)
      .pipe(
        map((r) =>
          (r.data ?? [])
            .filter((g) => g?.code != null && g.code.trim() !== '')
            .map((g) => ({
              value: g.code.trim(),
              label: g.code.trim() + (g.description?.trim() ? ' - ' + g.description.trim() : ''),
            }))
        ),
        catchError(() => of([]))
      );
  }

  getAnswerCodes(questionCode: string, response?: string | null, groupCode?: string | null): Observable<AnswerCodeOption[]> {
    const params: string[] = [];
    if (response)  params.push(`response=${encodeURIComponent(response)}`);
    if (groupCode) params.push(`groupCode=${encodeURIComponent(groupCode)}`);
    const qs = params.length ? '?' + params.join('&') : '';
    return this.apiService
      .get<ApiResponse<{ answerCode: string; answerDescription?: string; commentRequired?: string; additionalDateFlag?: string; deferralPeriod?: number; periodType?: string; interdictionCode?: string; numeralValue?: number }[]>>(
        `/api/v1/health-history-answers/${encodeURIComponent(questionCode)}${qs}`
      )
      .pipe(
        map((r) =>
          (r.data ?? [])
            .filter((a) => a?.answerCode != null && a.answerCode.trim() !== '')
            .map((a) => ({
              value:             a.answerCode.trim(),
              label:             a.answerCode.trim() + (a.answerDescription?.trim() ? ' - ' + a.answerDescription.trim() : ''),
              commentReq:        a.commentRequired === 'Y',
              additionalDateFlag: a.additionalDateFlag === 'Y',
              deferralPeriod:    a.deferralPeriod != null ? Number(a.deferralPeriod) : undefined,
              periodType:        a.periodType?.trim() || undefined,
              interCode:         a.interdictionCode?.trim() || undefined,
              numeralValue:      a.numeralValue != null ? Number(a.numeralValue) : undefined,
            } as AnswerCodeOption))
        ),
        catchError(() => of([]))
      );
  }

  getHHQuestions(): Observable<HHQuestionListDto[]> {
    return this.apiService
      .post<ApiResponse<HHQuestionListDto[]>>(API.HEALTH_HISTORY_QUESTIONS.SEARCH, {
        activeOnly: true,
        sortBy: 'QuestionCode',
        sortDir: 'ASC',
      })
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => throwError(() => error))
      );
  }

  validateUnitId(unitId: string): Observable<UnitValidationResult> {
    return this.apiService
      .post<any>(API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT, { unitId, validateFfValue: 'DONOR' })
      .pipe(
        map((res: any) => {
          if (res.success && (res.item || res.data)) return res.item || res.data;
          throw { error: { message: res.error || res.message } };
        }),
        catchError((error) => throwError(() => error))
      );
  }

  getDropdownOptions(): Observable<{
    donorSignature: DropdownOption[];
    donationType: DropdownOption[];
  }> {
    return this.apiService
      .get<ApiResponse<{ donationType: string; description: string }[]>>(
        `${API.REGISTER_DONATION_LOOKUPS.DONATION_TYPES}?includeAuditTypes=true`
      )
      .pipe(
        map((r) => ({
          donorSignature: [
            { value: 'Yes', label: 'Yes' },
            { value: 'No', label: 'No' },
          ],
          donationType: (r.data ?? []).map((d) => ({
            value: d.donationType,
            label: `${d.donationType}-${d.description}`,
          })),
        })),
        catchError(() =>
          of({
            donorSignature: [
              { value: 'Yes', label: 'Yes' },
              { value: 'No', label: 'No' },
            ],
            donationType: [],
          })
        )
      );
  }

  getProcedureCodesByType(donationType: string): Observable<DropdownOption[]> {
    return this.apiService
      .get<ApiResponse<{ procedureCode: string; description: string }[]>>(
        API.REGISTER_DONATION_LOOKUPS.PROCEDURE_CODES_BY_TYPE(donationType)
      )
      .pipe(
        map((r) =>
          (r.data ?? []).map((p) => ({
            value: p.procedureCode,
            label: `${p.procedureCode}-${p.description}`,
          }))
        ),
        catchError(() => of([]))
      );
  }
}
