import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DonneesService, PhotoGalerie } from '../donnees.service';

// Gestion des photos de la galerie d'une prestation (espace gérant).
@Component({
  selector: 'app-galerie-admin',
  imports: [FormsModule],
  template: `
    <details class="galerie">

      <summary>
        Galerie photo
        @if (photos().length) { ({{ photos().length }}) }
      </summary>

      @if (message()) {
        <p class="info">{{ message() }}</p>
      }

      <label class="ajout">
        + Ajouter des photos
        <input type="file" accept="image/*" multiple (change)="ajouter($event)" [disabled]="envoi()">
      </label>

      <div class="photos">
        @for (photo of photos(); track photo.id) {

          <form class="photo" (ngSubmit)="enregistrer(photo)">
            <img [src]="photo.image_url" [alt]="photo.titre">
            <input [name]="'titre' + photo.id" [(ngModel)]="photo.titre" placeholder="Titre de la photo">
            <textarea rows="2" [name]="'desc' + photo.id" [(ngModel)]="photo.description" placeholder="Petite description"></textarea>
            <div class="row">
              <input type="number" class="ordre" title="Ordre" [name]="'ordre' + photo.id" [(ngModel)]="photo.ordre">
              <button type="submit" class="primary">Enregistrer</button>
              <button type="button" class="danger" (click)="supprimer(photo)">✕</button>
            </div>
          </form>

        } @empty {
          <p class="muted">Aucune photo pour le moment.</p>
        }
      </div>

    </details>
  `,
  styles: `
    .galerie { margin-top: 6px; padding-top: 12px; border-top: 1px solid #f1e5d8; }
    summary { cursor: pointer; font-weight: 600; color: #e77c19; }
    .ajout { display: inline-block; margin: 14px 0; padding: 9px 16px; border-radius: 20px; background: #f28c28; color: white; font-weight: 600; cursor: pointer; }
    .ajout input { display: none; }
    .photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr)); gap: 14px; }
    .photo { display: grid; gap: 8px; }
    .photo img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 10px; }
    .row { display: flex; gap: 6px; }
    .ordre { width: 60px; }
    input, textarea { padding: 8px 10px; border: 1px solid #eadccd; border-radius: 10px; font: inherit; font-size: 14px; }
    button { padding: 7px 12px; border: none; border-radius: 16px; background: #f3ebe2; font: inherit; font-weight: 600; cursor: pointer; }
    button.primary { flex: 1; background: #f28c28; color: white; }
    button.danger { background: #fbe3df; color: #b3372a; }
    .info, .muted { color: #6f6860; font-size: 14px; }
  `
})
export class GalerieAdmin implements OnInit {

  private donnees = inject(DonneesService);

  prestationId = input.required<number>();

  photos = signal<PhotoGalerie[]>([]);
  envoi = signal(false);
  message = signal('');

  ngOnInit(): void {
    this.charger().catch(console.error);
  }

  async charger(): Promise<void> {
    this.photos.set(await this.donnees.galerie(this.prestationId()));
  }

  async ajouter(evenement: Event): Promise<void> {
    const champ = evenement.target as HTMLInputElement;
    const fichiers = Array.from(champ.files ?? []);
    if (!fichiers.length) return;

    this.envoi.set(true);
    let ordre = Math.max(0, ...this.photos().map(p => p.ordre));

    try {
      for (const [i, fichier] of fichiers.entries()) {
        this.message.set(`Envoi de la photo ${i + 1} sur ${fichiers.length}…`);
        await this.donnees.ajouterPhotoGalerie(this.prestationId(), ++ordre, fichier);
      }
      this.message.set(`${fichiers.length} photo(s) ajoutée(s). Ajoutez-leur un titre et une description.`);
    } catch (e) {
      console.error(e);
      this.message.set(`Erreur pendant l'envoi : ${(e as Error).message}`);
    }

    champ.value = '';
    this.envoi.set(false);
    await this.charger();
  }

  async enregistrer(photo: PhotoGalerie): Promise<void> {
    try {
      await this.donnees.enregistrerPhotoGalerie(photo);
      this.message.set('Photo enregistrée.');
      await this.charger();
    } catch (e) {
      this.message.set(`Erreur : ${(e as Error).message}`);
    }
  }

  async supprimer(photo: PhotoGalerie): Promise<void> {
    if (!confirm('Supprimer cette photo ?')) return;

    try {
      await this.donnees.supprimerPhotoGalerie(photo);
      this.message.set('Photo supprimée.');
      await this.charger();
    } catch (e) {
      this.message.set(`Erreur : ${(e as Error).message}`);
    }
  }

}
