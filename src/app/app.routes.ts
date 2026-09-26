import { Routes } from '@angular/router';

import { Accueil } from './accueil/accueil';
import { Prestations } from './prestations/prestations';
import { Reservation } from './reservation/reservation';

export const routes: Routes = [
  {
    path: '',
    component: Accueil
  },

  {
    path: 'prestations',
    component: Prestations
  },

  {
    path: 'reservation',
    component: Reservation
  },

  {
    path: '**',
    redirectTo: ''
  }
];