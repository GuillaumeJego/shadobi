import { Injectable, signal } from '@angular/core';
import { createClient, Session } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase.config';

export interface Tarif {
  prix: string;
  duree: string;
}

export interface Prestation {
  id?: number;
  ordre: number;
  icone: string;
  categorie: string;
  titre: string;
  description: string;
  tarifs: Tarif[];
  note: string;
  visible: boolean;
}

export interface Photo {
  emplacement: string;
  libelle: string;
  url: string;
  alt: string;
}

export interface Avis {
  id?: number;
  cree_le?: string;
  nom: string;
  note: number;
  message: string;
  valide?: boolean;
}

// Photos affichées si la base ne répond pas.
export const PHOTOS_PAR_DEFAUT: Record<string, Photo> = {
  'promenades': {
    emplacement: 'promenades',
    libelle: 'Accueil — Des promenades dynamiques',
    url: 'assets/images/IMG-20241002-WA0003.jpg',
    alt: 'Shadobi & Co - Accueil'
  },
  'terrain': {
    emplacement: 'terrain',
    libelle: 'Accueil — Un grand terrain',
    url: 'assets/images/IMG_20260711_193906.jpg',
    alt: 'Compagnon accueilli chez Shadobi & Co'
  },
  'a-propos': {
    emplacement: 'a-propos',
    libelle: 'À propos — Une passion',
    url: 'assets/images/IMG_20260424_100418.jpg',
    alt: 'À propos de Shadobi & Co'
  }
};

@Injectable({ providedIn: 'root' })
export class DonneesService {

  private supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  readonly session = signal<Session | null>(null);

  constructor() {
    this.supabase.auth.getSession().then(({ data }) => this.session.set(data.session));
    this.supabase.auth.onAuthStateChange((_event, session) => this.session.set(session));
  }


  // =======================================================
  // LECTURE PUBLIQUE
  // =======================================================

  async prestations(): Promise<Prestation[]> {
    const { data, error } = await this.supabase
      .from('prestations')
      .select('*')
      .order('ordre');

    if (error) throw error;
    return data as Prestation[];
  }

  async photos(): Promise<Record<string, Photo>> {
    const photos = { ...PHOTOS_PAR_DEFAUT };

    const { data, error } = await this.supabase.from('photos').select('*');
    if (error) throw error;

    for (const photo of data as Photo[]) {
      photos[photo.emplacement] = photo;
    }
    return photos;
  }

  async avisValides(): Promise<Avis[]> {
    const { data, error } = await this.supabase
      .from('avis')
      .select('id, cree_le, nom, note, message')
      .eq('valide', true)
      .order('cree_le', { ascending: false });

    if (error) throw error;
    return data as Avis[];
  }

  async deposerAvis(avis: Avis): Promise<void> {
    const { error } = await this.supabase
      .from('avis')
      .insert({ nom: avis.nom, note: avis.note, message: avis.message });

    if (error) throw error;
  }


  // =======================================================
  // ESPACE GÉRANT
  // =======================================================

  async connexion(email: string, motDePasse: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password: motDePasse });
    if (error) throw error;
  }

  async deconnexion(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async tousLesAvis(): Promise<Avis[]> {
    const { data, error } = await this.supabase
      .from('avis')
      .select('*')
      .order('cree_le', { ascending: false });

    if (error) throw error;
    return data as Avis[];
  }

  async validerAvis(id: number, valide: boolean): Promise<void> {
    const { error } = await this.supabase.from('avis').update({ valide }).eq('id', id);
    if (error) throw error;
  }

  async supprimerAvis(id: number): Promise<void> {
    const { error } = await this.supabase.from('avis').delete().eq('id', id);
    if (error) throw error;
  }

  async enregistrerPrestation(prestation: Prestation): Promise<void> {
    const { id, ...champs } = prestation;

    const { error } = id
      ? await this.supabase.from('prestations').update(champs).eq('id', id)
      : await this.supabase.from('prestations').insert(champs);

    if (error) throw error;
  }

  async supprimerPrestation(id: number): Promise<void> {
    const { error } = await this.supabase.from('prestations').delete().eq('id', id);
    if (error) throw error;
  }

  async enregistrerPhoto(photo: Photo): Promise<void> {
    const { error } = await this.supabase.from('photos').upsert(photo);
    if (error) throw error;
  }

  async remplacerPhoto(photo: Photo, fichier: File): Promise<string> {
    const extension = fichier.name.split('.').pop()?.toLowerCase() || 'jpg';
    const chemin = `${photo.emplacement}-${Date.now()}.${extension}`;

    const envoi = await this.supabase.storage.from('photos').upload(chemin, fichier);
    if (envoi.error) throw envoi.error;

    const url = this.supabase.storage.from('photos').getPublicUrl(chemin).data.publicUrl;

    const { error } = await this.supabase
      .from('photos')
      .upsert({ ...photo, url });

    if (error) throw error;
    return url;
  }

}
