import { Injectable, signal } from '@angular/core';
import { createClient, Session } from '@supabase/supabase-js';

import { imagePourLeWeb } from './image-web';
import { Rubrique, RUBRIQUES_PAR_DEFAUT } from './rubriques.defaut';
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

export interface PhotoGalerie {
  id?: number;
  prestation_id: number;
  ordre: number;
  image_url: string;
  titre: string;
  description: string;
}

export interface Avis {
  id?: number;
  cree_le?: string;
  nom: string;
  note: number;
  message: string;
  valide?: boolean;
}


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

  async prestation(id: number): Promise<Prestation | null> {
    const { data, error } = await this.supabase
      .from('prestations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as Prestation | null;
  }

  async galerie(prestationId: number): Promise<PhotoGalerie[]> {
    const { data, error } = await this.supabase
      .from('prestation_photos')
      .select('*')
      .eq('prestation_id', prestationId)
      .order('ordre')
      .order('id');

    if (error) throw error;
    return data as PhotoGalerie[];
  }

  // Les rubriques absentes de la base gardent leur texte par défaut.
  async rubriques(): Promise<Rubrique[]> {
    const { data, error } = await this.supabase.from('rubriques').select('*');
    if (error) throw error;

    const enBase = new Map((data as Rubrique[]).map(r => [r.emplacement, r]));
    return RUBRIQUES_PAR_DEFAUT
      .map(defaut => enBase.get(defaut.emplacement) ?? defaut)
      .sort((a, b) => a.ordre - b.ordre);
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

  // Les photos de la galerie sont supprimées avec la prestation.
  async supprimerPrestation(id: number): Promise<void> {
    const photos = await this.galerie(id);

    const { error } = await this.supabase.from('prestations').delete().eq('id', id);
    if (error) throw error;

    for (const photo of photos) {
      await this.supprimerImage(photo.image_url);
    }
  }

  async enregistrerRubrique(rubrique: Rubrique): Promise<void> {
    const { error } = await this.supabase.from('rubriques').upsert(rubrique);
    if (error) throw error;
  }


  // =======================================================
  // GALERIES DES PRESTATIONS
  // =======================================================

  async enregistrerPhotoGalerie(photo: PhotoGalerie): Promise<void> {
    const { id, ...champs } = photo;
    const { error } = await this.supabase.from('prestation_photos').update(champs).eq('id', id!);
    if (error) throw error;
  }

  async ajouterPhotoGalerie(prestationId: number, ordre: number, fichier: File): Promise<void> {
    const image_url = await this.envoyerImage(`galerie/${prestationId}/photo`, fichier);

    const { error } = await this.supabase
      .from('prestation_photos')
      .insert({ prestation_id: prestationId, ordre, image_url });

    if (error) throw error;
  }

  async supprimerPhotoGalerie(photo: PhotoGalerie): Promise<void> {
    const { error } = await this.supabase.from('prestation_photos').delete().eq('id', photo.id!);
    if (error) throw error;
    await this.supprimerImage(photo.image_url);
  }


  // =======================================================
  // STOCKAGE DES IMAGES
  // =======================================================

  // Réduit l'image, l'envoie dans le stockage et renvoie son adresse publique.
  async envoyerImage(prefixe: string, fichier: File): Promise<string> {
    const image = await imagePourLeWeb(fichier);
    const extension = image.type === 'image/jpeg' ? 'jpg' : (fichier.name.split('.').pop()?.toLowerCase() || 'jpg');
    const chemin = `${prefixe}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${extension}`;

    const { error } = await this.supabase.storage
      .from('photos')
      .upload(chemin, image, { contentType: image.type || fichier.type });

    if (error) throw error;

    return this.supabase.storage.from('photos').getPublicUrl(chemin).data.publicUrl;
  }

  // Supprime une image du stockage. Ignore les images d'origine
  // du site (assets/…), qui ne sont pas dans Supabase.
  async supprimerImage(url: string | null): Promise<void> {
    const repere = '/storage/v1/object/public/photos/';
    const position = url?.indexOf(repere) ?? -1;
    if (!url || position < 0) return;

    const chemin = decodeURIComponent(url.slice(position + repere.length));
    const { error } = await this.supabase.storage.from('photos').remove([chemin]);
    if (error) console.error(error);
  }

}
