import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth-service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {

  email = '';
  password = '';
  confirmPassword = '';

  errorMessage = '';
  successMessage = '';

  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  register(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage =
        'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    this.loading = true;

    this.authService.register({
      email: this.email,
      password: this.password
    }).subscribe({

      next: (response) => {

        this.loading = false;

        this.successMessage = response.message;

        // Attendre un peu puis aller vers login
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },

      error: (error) => {

        this.loading = false;

        if (error.error?.detail) {
          this.errorMessage = error.error.detail;
        } else {
          this.errorMessage =
            'Une erreur est survenue lors de l inscription.';
        }
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
