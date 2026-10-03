import { Injectable } from '@angular/core';

import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';

import {
  Observable
} from 'rxjs';

import {
  map
} from 'rxjs/operators';

import {
  AuthService
} from '../auth-service';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}


  canActivate(): Observable<boolean | UrlTree> {

    return this.authService
      .checkAuthGuard()
      .pipe(

        map((isAuthenticated) => {

          // =========================
          // CONNECTÉ
          // =========================

          if (isAuthenticated) {

            return true;
          }


          // =========================
          // PAS CONNECTÉ
          // =========================

          return this.router.createUrlTree([
            '/login'
          ]);

        })

      );
  }

}