import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';

export interface Donor {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  bloodType?: string;
  lastDonationDate?: Date;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class DonorFunctionsService {
  private readonly endpoint = 'donors';

  constructor(private apiService: ApiService) {}

  /**
   * Get all donors
   */
  getDonors(): Observable<Donor[]> {
    return this.apiService.get<Donor[]>(this.endpoint);
  }

  /**
   * Get donor by ID
   */
  getDonorById(id: string): Observable<Donor> {
    return this.apiService.get<Donor>(`${this.endpoint}/${id}`);
  }

  /**
   * Create new donor
   */
  createDonor(donor: Donor): Observable<Donor> {
    return this.apiService.post<Donor>(this.endpoint, donor);
  }

  /**
   * Update donor
   */
  updateDonor(id: string, donor: Donor): Observable<Donor> {
    return this.apiService.put<Donor>(`${this.endpoint}/${id}`, donor);
  }

  /**
   * Delete donor
   */
  deleteDonor(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Search donors
   */
  searchDonors(searchTerm: string): Observable<Donor[]> {
    return this.apiService.get<Donor[]>(`${this.endpoint}/search?q=${searchTerm}`);
  }
}
