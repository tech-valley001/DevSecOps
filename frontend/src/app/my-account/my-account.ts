import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  AuthService,
  MeResponse
} from '../auth-service';


@Component({
  selector: 'app-my-account',
  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './my-account.html',
  styleUrls: ['./my-account.css']
})
export class MyAccount implements OnInit {

  user: MeResponse | null = null;

  loading = true;

  errorMessage = '';


  constructor(
    private authService: AuthService,
    private router: Router,

    // Change Detection
    private cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {

    console.log('MY ACCOUNT → début de la vérification');


    this.authService.getMe().subscribe({

      // =========================
      // SUCCESS
      // =========================

      next: (user) => {

        console.log(
          'MY ACCOUNT → utilisateur reçu :',
          user
        );


        // Récupérer l'utilisateur
        this.user = user;


        // Arrêter le chargement
        this.loading = false;


        // Forcer Angular à mettre à jour la vue
        this.cdr.detectChanges();


        console.log(
          'MY ACCOUNT → affichage mis à jour'
        );

      },


      // =========================
      // ERROR
      // =========================

      error: (error) => {

        console.log(
          'MY ACCOUNT → erreur :',
          error
        );


        // Arrêter le chargement
        this.loading = false;


        /*
         * 401 = utilisateur non connecté
         */

        if (error.status === 401) {

          this.router.navigate([
            '/login'
          ]);

        } else {

          this.errorMessage =
            'Impossible de récupérer les informations du compte.';

        }


        // Forcer Angular à mettre à jour la vue
        this.cdr.detectChanges();

      }

    });

  }

}