import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  ApiResponse,
  DonationDeferralAuditDto,
} from '../models/donation-deferral-audit.model';

/**
 * Service for Donation/Deferral Audit Details API
 *
 * Provides read-only access to comprehensive audit information including:
 * - Donation/deferral transaction details
 * - Health history questionnaire responses
 * - Physical examination findings
 *
 * Based on API documentation: donation-deferral-audit-api-documentation.md
 */
@Injectable({
  providedIn: 'root',
})
export class DonationDeferralAuditService {
  private readonly apiService = inject(ApiService);

  /**
   * Get comprehensive audit details for a donation/deferral transaction
   *
   * @param transactionId - Unique identifier of the donation/deferral transaction
   * @returns Observable of DonationDeferralAuditDto with audit details
   * @throws 400 - Transaction ID is required
   * @throws 404 - No audit details found for transaction ID
   * @throws 500 - Server error while retrieving audit details
   */
  getAuditDetails(transactionId: string): Observable<DonationDeferralAuditDto> {
    if (!transactionId || transactionId.trim() === '') {
      return throwError(() => ({
        status: 400,
        error: { message: 'Transaction ID is required' },
      }));
    }

    return this.apiService
      .get<ApiResponse<DonationDeferralAuditDto>>(
        API.DONOR_FUNCTIONS.DONATION_DEFERRAL_AUDIT.GET(transactionId)
      )
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw {
              status: 404,
              error: {
                message: `No audit details found for transaction ID '${transactionId}'`,
              },
            };
          }
          return response.data;
        }),
        catchError((error) => {
          // Handle different error scenarios
          if (error.status === 404) {
            console.error('Audit details not found:', error);
            return throwError(() => ({
              status: 404,
              error: {
                message:
                  error.error?.message ||
                  `No audit details found for transaction ID '${transactionId}'`,
              },
            }));
          }

          if (error.status === 400) {
            console.error('Bad request:', error);
            return throwError(() => ({
              status: 400,
              error: {
                message: error.error?.message || 'Transaction ID is required',
              },
            }));
          }

          // Generic server error
          console.error('Error fetching audit details:', error);
          return throwError(() => ({
            status: error.status || 500,
            error: {
              message:
                error.error?.message ||
                'An error occurred while retrieving audit details. Please try again.',
            },
          }));
        })
      );
  }
}
