import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  AuthService,
  MeResponse
} from '../auth-service';

@Component({
  selector: 'app-login',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {

  email = '';
  password = '';

  errorMessage = '';
  successMessage = '';

  loading = false;


  constructor(
    private authService: AuthService,
    private router: Router
  ) {}


  // =========================
  // LOGIN
  // =========================

  login(): void {

    // Réinitialiser les messages
    this.errorMessage = '';
    this.successMessage = '';


    // Vérification simple
    if (!this.email || !this.password) {

      this.errorMessage =
        'Veuillez remplir tous les champs.';

      return;
    }


    this.loading = true;


    // =========================
    // ÉTAPE 1 : LOGIN
    // =========================

    this.authService.login({

      email: this.email,
      password: this.password

    }).subscribe({

      next: (response) => {

        console.log('Login réussi');


        // =========================
        // ÉTAPE 2 : RÉCUPÉRER USER
        // =========================

        this.authService.getMe().subscribe({

          next: (user: MeResponse) => {

            console.log(
              'Utilisateur récupéré :',
              user
            );


            // IMPORTANT :
            // mettre l'utilisateur dans le BehaviorSubject
            this.authService.setCurrentUser(user);


            this.loading = false;

            this.successMessage =
              response.message;


            // =========================
            // REDIRECTION
            // =========================

            this.router.navigate([
              '/dashboard'
            ]);

          },


          error: (error) => {

            console.error(
              'Erreur /me :',
              error
            );

            this.loading = false;

            this.errorMessage =
              'Impossible de récupérer les informations du compte.';

          }

        });

      },


      // =========================
      // ERREUR LOGIN
      // =========================

      error: (error) => {

        console.error(
          'Erreur login :',
          error
        );

        this.loading = false;


        if (error.error?.detail) {

          this.errorMessage =
            error.error.detail;

        } else {

          this.errorMessage =
            'Une erreur est survenue lors de la connexion.';
        }

      }

    });
  }


  // =========================
  // REGISTER
  // =========================

  goToRegister(): void {

    this.router.navigate([
      '/register'
    ]);

  }

}