import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Dashboard} from '../app/dashboard/dashboard';
import { Header } from './header/header';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet,Dashboard,Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('front');
}
