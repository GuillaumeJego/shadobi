import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AvisSection } from '../avis-section/avis-section';
import { DonneesService, Photo, PHOTOS_PAR_DEFAUT, Prestation } from '../donnees.service';

@Component({
  selector: 'app-accueil',
  imports: [RouterLink, AvisSection],
  templateUrl: './accueil.html',
  styleUrl: './accueil.scss'
})
export class Accueil implements OnInit {

  private donnees = inject(DonneesService);

  prestations = signal<Prestation[]>([]);
  photos = signal<Record<string, Photo>>(PHOTOS_PAR_DEFAUT);

  menuOpen = false;

  ngOnInit(): void {
    this.donnees.prestations().then(p => this.prestations.set(p)).catch(console.error);
    this.donnees.photos().then(p => this.photos.set(p)).catch(console.error);
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

}
