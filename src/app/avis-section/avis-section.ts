import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Avis, DonneesService } from '../donnees.service';

// Liste des avis publiés + formulaire.
// Sur l'accueil : tous les avis. Sur la page d'une prestation
// (prestationId renseigné) : ceux de cette prestation, et le
// nouvel avis lui est rattaché.
@Component({
  selector: 'app-avis-section',
  imports: [FormsModule],
  templateUrl: './avis-section.html',
  styleUrl: './avis-section.scss'
})
export class AvisSection {

  private donnees = inject(DonneesService);

  prestationId = input<number | null>(null);

  avis = signal<Avis[]>([]);

  nouvelAvis: Avis = { nom: '', note: 5, message: '' };

  etat = signal<'saisie' | 'envoi' | 'merci' | 'erreur'>('saisie');

  readonly etoiles = [1, 2, 3, 4, 5];

  constructor() {
    // Recharge si on passe d'une prestation à une autre.
    effect(() => {
      const id = this.prestationId() ?? undefined;
      this.etat.set('saisie');
      this.donnees.avisValides(id).then(a => this.avis.set(a)).catch(console.error);
    });
  }

  async envoyer(): Promise<void> {
    this.etat.set('envoi');

    try {
      await this.donnees.deposerAvis({
        nom: this.nouvelAvis.nom.trim(),
        note: this.nouvelAvis.note,
        message: this.nouvelAvis.message.trim(),
        prestation_id: this.prestationId()
      });
      this.nouvelAvis = { nom: '', note: 5, message: '' };
      this.etat.set('merci');
    } catch (erreur) {
      console.error(erreur);
      this.etat.set('erreur');
    }
  }

}
