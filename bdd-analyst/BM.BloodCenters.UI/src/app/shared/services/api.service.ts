import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ApiRequestOptions {
  headers?: HttpHeaders;
  params?: HttpParams;
  reportProgress?: boolean;
  responseType?: any;
  body?: any;
  context?: HttpContext;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) {}

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.httpClient.get<T>(
      `${this.baseUrl}/${this.normalizeEndpoint(endpoint)}`,
      options
    );
  }

  /**
   * POST request
   */
  post<T>(
    endpoint: string,
    body: any,
    options?: ApiRequestOptions
  ): Observable<T> {
    return this.httpClient.post<T>(
      `${this.baseUrl}/${this.normalizeEndpoint(endpoint)}`,
      body,
      options
    );
  }

  /**
   * PUT request
   */
  put<T>(
    endpoint: string,
    body: any,
    options?: ApiRequestOptions
  ): Observable<T> {
    return this.httpClient.put<T>(
      `${this.baseUrl}/${this.normalizeEndpoint(endpoint)}`,
      body,
      options
    );
  }

  /**
   * PATCH request
   */
  patch<T>(
    endpoint: string,
    body: any,
    options?: ApiRequestOptions
  ): Observable<T> {
    return this.httpClient.patch<T>(
      `${this.baseUrl}/${this.normalizeEndpoint(endpoint)}`,
      body,
      options
    );
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.httpClient.delete<T>(
      `${this.baseUrl}/${this.normalizeEndpoint(endpoint)}`,
      options
    );
  }

  /**
   * Normalize endpoint - remove leading/trailing slashes
   */
  private normalizeEndpoint(endpoint: string): string {
    return endpoint.replace(/^\/+|\/+$/g, '');
  }
}
