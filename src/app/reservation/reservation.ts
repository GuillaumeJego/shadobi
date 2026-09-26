import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reservation',
  imports: [RouterLink],
  templateUrl: './reservation.html',
  styleUrl: './reservation.scss'
})
export class Reservation {

  private location = inject(Location);
  private router = inject(Router);

  // Revient à la page précédente, ou à l'accueil si le visiteur
  // est arrivé directement sur cette page.
  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

}
