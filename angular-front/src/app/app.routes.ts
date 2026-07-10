import { Routes } from '@angular/router';
import { Acceuil } from './acceuil/acceuil';
import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'acceuil', 
    pathMatch: 'full' 
  },
  { 
    path: 'acceuil', 
    component: Acceuil 
  },
  { 
    path: 'dashboard/:id', 
    component: Dashboard 
  },
  { 
    path: 'dashboard', 
    redirectTo: 'acceuil',
    pathMatch: 'full'
  },
  { 
    path: '**', 
    redirectTo: 'acceuil' 
  }
];