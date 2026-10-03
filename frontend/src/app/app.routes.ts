import { Routes } from '@angular/router';
import { Acceuil } from './acceuil/acceuil';
import { Dashboard } from './dashboard/dashboard';
import { Zero } from './zero/zero';
import { Login } from './login/login';
import { Register } from './register/register';
import { MyAccount } from './my-account/my-account';
import { AuthGuard } from './guards/auth.guard';
export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'acceuil', 
    pathMatch: 'full' 
  },


  { 
    path: 'acceuil', 
    component: Zero 
  },
   { 
    path: 'login', 
    component: Login 
  },
   { 
    path: 'register', 
    component: Register 
  },
  { 
    path: 'dashboard/:id', 
    component: Dashboard, 
    canActivate:[AuthGuard]
  },
  { 
    path: 'dashboard', 
   component:Acceuil,
   canActivate:[AuthGuard]
  },
  {path :'my-account',
    component:MyAccount,
    canActivate:[AuthGuard]
  },
  { 
    path: '**', 
    redirectTo: 'acceuil' 
  }
];