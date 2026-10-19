import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ViewAssociatedInterdictionComponent } from '../view-associated-interdiction';

const BASE_URL =
  '/api/v1/system-admin/view-associated-interdictions-to-user';

interface ViewAssociatedInterdictionApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    code: string;
    type: string;
    description: string;
    viewLevel: string;
    effDate: string;
  }[];
}

export interface AssociatedInterdiction {
  code: string;
  type: string;
  description: string;
  level: number;
  effectiveDate: string; 
}

@Injectable({
  providedIn: 'root',
})
export class ViewAssociatedInterdictionService {
  constructor(private http: HttpClient) {}

getAssociatedInterdictions(
  accessClassCode: string
): Observable<AssociatedInterdiction[]> {
  return this.http
    .get<ViewAssociatedInterdictionApiResponse>(
      `${BASE_URL}/${accessClassCode}`
    )
    .pipe(
      map((response) =>
        (response?.data ?? []).map((item) => ({
          code: item.code,
          type: item.type,
          description: item.description,
          level: Number(item.viewLevel),
          effectiveDate: item.effDate,
        }))
      )
    );
}

}
