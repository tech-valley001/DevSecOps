import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RecentFile {
  id: number;
  filename: string;
  imported_at: string;
  sheets_count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class Api {
  private readonly baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  getRecentFiles(): Observable<RecentFile[]> {
    return this.http.get<RecentFile[]>(`${this.baseUrl}/files`);
  }

  getFileDashboard(fileId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/files/${fileId}/dashboard`);
  }
// Remplace 'file: File' par 'file: globalThis.File'
analyzeCSV(file: any): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post<any>(`${this.baseUrl}/analyze`, formData);
}
}