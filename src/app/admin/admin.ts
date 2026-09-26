import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Avis, DonneesService, Photo, Prestation } from '../donnees.service';

type Onglet = 'avis' | 'prestations' | 'photos';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin {

  donnees = inject(DonneesService);

  email = '';
  motDePasse = '';

  onglet = signal<Onglet>('avis');
  message = signal('');
  erreur = signal('');

  avis = signal<Avis[]>([]);
  prestations = signal<Prestation[]>([]);
  photos = signal<Photo[]>([]);

  constructor() {
    // Recharge tout dès que le gérant est connecté.
    effect(() => {
      if (this.donnees.session()) {
        this.charger();
      }
    });
  }

  async connexion(): Promise<void> {
    await this.action(() => this.donnees.connexion(this.email, this.motDePasse), '');
    this.motDePasse = '';
  }

  async deconnexion(): Promise<void> {
    await this.donnees.deconnexion();
  }

  async charger(): Promise<void> {
    await this.action(async () => {
      this.avis.set(await this.donnees.tousLesAvis());
      this.prestations.set(await this.donnees.prestations());
      this.photos.set(Object.values(await this.donnees.photos()));
    }, '');
  }


  // =======================================================
  // AVIS
  // =======================================================

  async validerAvis(avis: Avis, valide: boolean): Promise<void> {
    await this.action(() => this.donnees.validerAvis(avis.id!, valide),
      valide ? 'Avis publié.' : 'Avis masqué.');
    await this.charger();
  }

  async supprimerAvis(avis: Avis): Promise<void> {
    if (!confirm(`Supprimer définitivement l'avis de ${avis.nom} ?`)) return;
    await this.action(() => this.donnees.supprimerAvis(avis.id!), 'Avis supprimé.');
    await this.charger();
  }


  // =======================================================
  // PRESTATIONS
  // =======================================================

  ajouterPrestation(): void {
    this.prestations.update(liste => [...liste, {
      ordre: liste.length + 1,
      icone: '🐾',
      categorie: '',
      titre: 'Nouvelle prestation',
      description: '',
      tarifs: [{ prix: '', duree: '' }],
      note: '',
      visible: false
    }]);
  }

  async enregistrerPrestation(prestation: Prestation): Promise<void> {
    await this.action(() => this.donnees.enregistrerPrestation(prestation),
      `« ${prestation.titre} » enregistrée.`);
    await this.charger();
  }

  async supprimerPrestation(prestation: Prestation): Promise<void> {
    if (!confirm(`Supprimer la prestation « ${prestation.titre} » ?`)) return;

    if (prestation.id) {
      await this.action(() => this.donnees.supprimerPrestation(prestation.id!), 'Prestation supprimée.');
      await this.charger();
    } else {
      this.prestations.update(liste => liste.filter(p => p !== prestation));
    }
  }


  // =======================================================
  // PHOTOS
  // =======================================================

  async remplacerPhoto(photo: Photo, evenement: Event): Promise<void> {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0];
    if (!fichier) return;

    await this.action(() => this.donnees.remplacerPhoto(photo, fichier), 'Photo remplacée.');
    champ.value = '';
    await this.charger();
  }

  async enregistrerTexteAlt(photo: Photo): Promise<void> {
    await this.action(() => this.donnees.enregistrerPhoto(photo), 'Description enregistrée.');
  }


  // =======================================================
  // OUTILS
  // =======================================================

  private async action(travail: () => Promise<unknown>, succes: string): Promise<void> {
    this.message.set('');
    this.erreur.set('');

    try {
      await travail();
      this.message.set(succes);
    } catch (e) {
      console.error(e);
      const texte = (e as { message?: string }).message ?? String(e);
      this.erreur.set(
        texte.includes('Invalid login credentials')
          ? 'E-mail ou mot de passe incorrect.'
          : texte.includes('row-level security')
            ? "Ce compte n'a pas le droit de modifier le site."
            : `Erreur : ${texte}`
      );
    }
  }

}
