import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { DonneesService } from './donnees.service';
import { MetanaCredit } from './metana-credit/metana-credit';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MetanaCredit
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  menuOpen = false;

  // Pas de mention MetanaFr ni de statistiques sur l'espace gérant.
  pageAdmin = signal(false);

  constructor() {
    const donnees = inject(DonneesService);

    // Compte chaque page vue (sauf l'espace gérant).
    inject(Router).events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        const page = e.urlAfterRedirects.split(/[?#]/)[0];
        this.pageAdmin.set(page.startsWith('/admin'));
        if (!this.pageAdmin()) {
          donnees.suivre('page', page);
        }
      });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

}
