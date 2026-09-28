import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AvisSection } from '../avis-section/avis-section';
import { DonneesService, PhotoGalerie, Prestation } from '../donnees.service';

@Component({
  selector: 'app-prestation-detail',
  imports: [RouterLink, AvisSection],
  templateUrl: './prestation-detail.html',
  styleUrl: './prestation-detail.scss'
})
export class PrestationDetail implements OnInit {

  private donnees = inject(DonneesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  prestation = signal<Prestation | null>(null);
  photos = signal<PhotoGalerie[]>([]);
  etat = signal<'chargement' | 'ok' | 'introuvable'>('chargement');

  // Index de la photo ouverte en grand, ou null.
  ouverte = signal<number | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => this.charger(Number(params.get('id'))));
  }

  private async charger(id: number): Promise<void> {
    this.etat.set('chargement');
    this.ouverte.set(null);

    try {
      // Sans galerie (ou si elle ne répond pas), la page s'affiche quand même.
      const [prestation, photos] = await Promise.all([
        this.donnees.prestation(id),
        this.donnees.galerie(id).catch(e => { console.error(e); return []; })
      ]);
      this.prestation.set(prestation);
      this.photos.set(photos);
      this.etat.set(prestation ? 'ok' : 'introuvable');
    } catch (e) {
      console.error(e);
      this.etat.set('introuvable');
    }
  }

  // Compté dans les statistiques (onglet admin).
  clicReservation(): void {
    this.donnees.suivre('reservation', this.router.url.split(/[?#]/)[0]);
  }

  // Ramène toujours à la section « Nos prestations » de l'accueil.
  retour(): void {
    this.router.navigate(['/'], { fragment: 'prestations' });
  }


  // =======================================================
  // VISIONNEUSE
  // =======================================================

  ouvrir(index: number): void {
    this.ouverte.set(index);
  }

  fermer(): void {
    this.ouverte.set(null);
  }

  suivante(sens: 1 | -1): void {
    const index = this.ouverte();
    if (index === null) return;

    const total = this.photos().length;
    this.ouverte.set((index + sens + total) % total);
  }

  @HostListener('document:keydown', ['$event'])
  clavier(evenement: KeyboardEvent): void {
    if (this.ouverte() === null) return;

    if (evenement.key === 'Escape') this.fermer();
    if (evenement.key === 'ArrowRight') this.suivante(1);
    if (evenement.key === 'ArrowLeft') this.suivante(-1);
  }

}
