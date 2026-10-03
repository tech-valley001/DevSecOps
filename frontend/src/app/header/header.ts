import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import {
  AuthService,
  MeResponse
} from '../auth-service';

@Component({
  selector: 'app-header',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './header.html',

  styleUrls: ['./header.css']
})
export class Header implements OnInit {

  currentUser: MeResponse | null = null;

  authChecked = false;


  constructor(
    private authService: AuthService,
    private router: Router,

    // IMPORTANT
    private cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {

    // =========================
    // UTILISATEUR
    // =========================

    this.authService.currentUser$.subscribe(
      (user) => {

        console.log(
          'HEADER → utilisateur reçu :',
          user
        );

        this.currentUser = user;

        // FORCER ANGULAR À RAFRAÎCHIR LA VUE
        this.cdr.detectChanges();
      }
    );


    // =========================
    // AUTH CHECKED
    // =========================

    this.authService.authChecked$.subscribe(
      (checked) => {

        console.log(
          'HEADER → authChecked reçu :',
          checked
        );

        this.authChecked = checked;

        // FORCER ANGULAR À RAFRAÎCHIR LA VUE
        this.cdr.detectChanges();
      }
    );

  }


  // =========================
  // IS LOGGED IN
  // =========================

  isLoggedIn(): boolean {

    return this.currentUser !== null;
  }


  // =========================
  // LOGOUT
  // =========================

  logout(): void {

    this.authService.logout().subscribe({

      next: () => {

        this.authService.setCurrentUser(null);

        this.router.navigate(['/login']);

        this.cdr.detectChanges();
      },

      error: () => {

        this.authService.setCurrentUser(null);

        this.router.navigate(['/login']);

        this.cdr.detectChanges();
      }

    });

  }

}