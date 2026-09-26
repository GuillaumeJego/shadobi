import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Avis, DonneesService } from '../donnees.service';

@Component({
  selector: 'app-avis-section',
  imports: [FormsModule],
  templateUrl: './avis-section.html',
  styleUrl: './avis-section.scss'
})
export class AvisSection implements OnInit {

  private donnees = inject(DonneesService);

  avis = signal<Avis[]>([]);

  nouvelAvis: Avis = { nom: '', note: 5, message: '' };

  etat = signal<'saisie' | 'envoi' | 'merci' | 'erreur'>('saisie');

  readonly etoiles = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    this.donnees.avisValides().then(a => this.avis.set(a)).catch(console.error);
  }

  async envoyer(): Promise<void> {
    this.etat.set('envoi');

    try {
      await this.donnees.deposerAvis({
        nom: this.nouvelAvis.nom.trim(),
        note: this.nouvelAvis.note,
        message: this.nouvelAvis.message.trim()
      });
      this.nouvelAvis = { nom: '', note: 5, message: '' };
      this.etat.set('merci');
    } catch (erreur) {
      console.error(erreur);
      this.etat.set('erreur');
    }
  }

}
