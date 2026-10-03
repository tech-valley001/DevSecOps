
import { Component ,signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from '../app/header/header';
import { AuthService } from '../app/auth-service';


@Component({
  selector: 'app-root',
  standalone: true,

  imports: [
    RouterOutlet,
    Header
  ],

  templateUrl: './app.html'
})
export class App {
    protected readonly title = signal('front');


  constructor(
    private authService: AuthService
  ) {

    /*
     * Cette fonction est exécutée au démarrage
     * de l'application.
     *
     * Elle vérifie si le cookie de session
     * existe toujours.
     */
    this.authService.checkAuth();
  }
}
