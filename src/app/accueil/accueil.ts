import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AvisSection } from '../avis-section/avis-section';
import { DonneesService, Prestation } from '../donnees.service';
import { Rubrique, RUBRIQUES_PAR_DEFAUT, rubriquesParEmplacement } from '../rubriques.defaut';

@Component({
  selector: 'app-accueil',
  imports: [RouterLink, AvisSection],
  templateUrl: './accueil.html',
  styleUrl: './accueil.scss'
})
export class Accueil implements OnInit {

  private donnees = inject(DonneesService);

  prestations = signal<Prestation[]>([]);
  r = signal<Record<string, Rubrique>>(rubriquesParEmplacement(RUBRIQUES_PAR_DEFAUT));

  menuOpen = false;

  ngOnInit(): void {
    this.donnees.prestations().then(p => this.prestations.set(p)).catch(console.error);
    this.donnees.rubriques().then(r => this.r.set(rubriquesParEmplacement(r))).catch(console.error);
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

}
