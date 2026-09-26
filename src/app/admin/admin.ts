import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Avis, DonneesService, Prestation } from '../donnees.service';
import { Rubrique } from '../rubriques.defaut';
import { GalerieAdmin } from './galerie-admin';

type Onglet = 'avis' | 'prestations' | 'rubriques';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, RouterLink, DatePipe, GalerieAdmin],
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
  rubriques = signal<Rubrique[]>([]);

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
      this.rubriques.set(await this.donnees.rubriques());
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
  // TEXTES ET IMAGES DE L'ACCUEIL
  // =======================================================

  async enregistrerRubrique(rubrique: Rubrique): Promise<void> {
    await this.action(() => this.donnees.enregistrerRubrique(rubrique),
      `« ${rubrique.libelle} » enregistrée.`);
  }

  // L'image est envoyée puis la rubrique est enregistrée aussitôt.
  async remplacerImage(rubrique: Rubrique, evenement: Event): Promise<void> {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0];
    if (!fichier) return;

    await this.action(async () => {
      const ancienne = rubrique.image_url;
      const url = await this.donnees.envoyerImage(rubrique.emplacement, fichier);
      await this.donnees.enregistrerRubrique({ ...rubrique, image_url: url });
      await this.donnees.supprimerImage(ancienne);
      this.rubriques.update(liste =>
        liste.map(r => r.emplacement === rubrique.emplacement ? { ...r, image_url: url } : r));
    }, 'Image remplacée.');

    champ.value = '';
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
