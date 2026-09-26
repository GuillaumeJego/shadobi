import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { DonneesService } from './donnees.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  menuOpen = false;

  constructor() {
    const donnees = inject(DonneesService);

    // Compte chaque page vue (sauf l'espace gérant).
    inject(Router).events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        const page = e.urlAfterRedirects.split(/[?#]/)[0];
        if (!page.startsWith('/admin')) {
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
