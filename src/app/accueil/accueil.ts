import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AvisSection } from '../avis-section/avis-section';
import { DonneesService, Prestation } from '../donnees.service';
import { LIEN_RESERVATION } from '../reservation.config';
import { Rubrique, RUBRIQUES_PAR_DEFAUT, rubriquesParEmplacement } from '../rubriques.defaut';

@Component({
  selector: 'app-accueil',
  imports: [RouterLink, AvisSection],
  templateUrl: './accueil.html',
  styleUrl: './accueil.scss'
})
export class Accueil implements OnInit {

  private donnees = inject(DonneesService);
  private route = inject(ActivatedRoute);

  prestations = signal<Prestation[]>([]);
  r = signal<Record<string, Rubrique>>(rubriquesParEmplacement(RUBRIQUES_PAR_DEFAUT));

  menuOpen = false;

  ngOnInit(): void {
    this.donnees.prestations()
      .then(p => {
        this.prestations.set(p);
        this.allerAuFragment();
      })
      .catch(console.error);
    this.donnees.rubriques().then(r => this.r.set(rubriquesParEmplacement(r))).catch(console.error);
  }

  // Les cartes arrivent après le premier affichage : on recale la page
  // sur l'ancre demandée (ex. /#prestations) une fois qu'elles sont là.
  private allerAuFragment(): void {
    const fragment = this.route.snapshot.fragment;
    if (!fragment) return;

    setTimeout(() => document.getElementById(fragment)?.scrollIntoView());
  }

  readonly lienReservation = LIEN_RESERVATION;

  // Compté dans les statistiques (onglet admin).
  clicReservation(): void {
    this.donnees.suivre('reservation', '/');
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

}
