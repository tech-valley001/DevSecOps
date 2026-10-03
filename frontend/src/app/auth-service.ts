import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  Observable,
  BehaviorSubject,
  of
} from 'rxjs';

import {
  map,
  catchError
} from 'rxjs/operators';


export interface RegisterRequest {
  email: string;
  password: string;
}


export interface LoginRequest {
  email: string;
  password: string;
}


export interface AuthResponse {
  message: string;
  email?: string;
}


export interface MeResponse {
  email: string;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = '/api';


  // =====================================
  // CURRENT USER
  // =====================================

  private currentUserSubject =
    new BehaviorSubject<MeResponse | null>(null);

  currentUser$ =
    this.currentUserSubject.asObservable();


  // =====================================
  // AUTH CHECKED
  // =====================================

  private authCheckedSubject =
    new BehaviorSubject<boolean>(false);

  authChecked$ =
    this.authCheckedSubject.asObservable();


  constructor(
    private http: HttpClient
  ) {}


  // =====================================
  // REGISTER
  // =====================================

  register(
    data: RegisterRequest
  ): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`,
      data,
      {
        withCredentials: true
      }
    );
  }


  // =====================================
  // LOGIN
  // =====================================

  login(
    data: LoginRequest
  ): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      data,
      {
        withCredentials: true
      }
    );
  }


  // =====================================
  // GET ME
  // =====================================

  getMe(): Observable<MeResponse> {

    return this.http.get<MeResponse>(
      `${this.apiUrl}/me`,
      {
        withCredentials: true
      }
    );
  }


  // =====================================
  // CHECK AUTH
  // Utilisé au démarrage de l'application
  // =====================================

  checkAuth(): void {

    this.authCheckedSubject.next(false);

    this.getMe().subscribe({

      next: (user) => {

        console.log(
          'CHECK AUTH → utilisateur connecté',
          user
        );

        this.currentUserSubject.next(user);

        this.authCheckedSubject.next(true);
      },


      error: (error) => {

        console.log(
          'CHECK AUTH → non connecté',
          error
        );

        this.currentUserSubject.next(null);

        this.authCheckedSubject.next(true);
      }

    });
  }


  // =====================================
  // CHECK AUTH POUR LE GUARD
  // =====================================

  checkAuthGuard(): Observable<boolean> {

    return this.getMe().pipe(

      map((user) => {

        console.log(
          'GUARD → utilisateur connecté',
          user
        );


        // Mettre l'utilisateur dans le BehaviorSubject
        this.currentUserSubject.next(user);


        // Authentification vérifiée
        this.authCheckedSubject.next(true);


        // Autoriser la route
        return true;
      }),


      catchError((error) => {

        console.log(
          'GUARD → utilisateur non connecté',
          error
        );


        // Supprimer l'utilisateur
        this.currentUserSubject.next(null);


        // Authentification vérifiée
        this.authCheckedSubject.next(true);


        // Refuser la route
        return of(false);
      })

    );
  }


  // =====================================
  // SET CURRENT USER
  // =====================================

  setCurrentUser(
    user: MeResponse | null
  ): void {

    this.currentUserSubject.next(user);
  }


  // =====================================
  // LOGOUT
  // =====================================

  logout(): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/logout`,
      {},
      {
        withCredentials: true
      }
    );
  }


  // =====================================
  // GET CURRENT USER
  // =====================================

  getCurrentUser(): MeResponse | null {

    return this.currentUserSubject.value;
  }


  // =====================================
  // IS LOGGED IN
  // =====================================

  isLoggedIn(): boolean {

    return this.currentUserSubject.value !== null;
  }


  // =====================================
  // IS AUTH CHECKED
  // =====================================

  isAuthChecked(): boolean {

    return this.authCheckedSubject.value;
  }

}