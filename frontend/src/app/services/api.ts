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
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getRecentFiles(): Observable<RecentFile[]> {
    return this.http.get<RecentFile[]>(`${this.baseUrl}/files`);
  }

  getFileDashboard(fileId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/files/${fileId}/dashboard`);
  }

  analyzeCSV(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/analyze`, formData);
  }

  deleteFile(fileId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/files/${fileId}`);
  }
deleteMultipleFiles(fileIds: number[]): Observable<any> {
  console.log('Payload envoyé à FastAPI :', { ids: fileIds });
  return this.http.post<any>(`${this.baseUrl}/files/delete-multiple`, { ids: fileIds });
}

  deleteAllFiles(): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/files/delete-all`);
  }
}