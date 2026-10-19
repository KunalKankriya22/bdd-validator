import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})

export class AddEditAddFunctionsService {
  private readonly baseUrl = environment.apiUrl;
  private readonly endpoint = '/api/v1/system-admin/add-functions';

  constructor(private http: HttpClient) { }

  getDetail(fcnId: number | string): Observable<any> {
    return this.http.get(`${this.baseUrl}${this.endpoint}/detail`, {
      params: { FCN_ID: fcnId.toString() }
    });
  }

  getIconsList(): Observable<any> {
    return this.http.get(`${this.baseUrl}${this.endpoint}/icons`);
  }

  add(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}${this.endpoint}`, data);
  }

  edit(id: any, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}${this.endpoint}/${id}`, data);
  }
}