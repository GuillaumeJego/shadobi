import { Injectable, signal } from '@angular/core';
import { createClient, Session } from '@supabase/supabase-js';

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

  async supprimerPrestation(id: number): Promise<void> {
    const { error } = await this.supabase.from('prestations').delete().eq('id', id);
    if (error) throw error;
  }

  async enregistrerRubrique(rubrique: Rubrique): Promise<void> {
    const { error } = await this.supabase.from('rubriques').upsert(rubrique);
    if (error) throw error;
  }

  // Envoie l'image dans le stockage et renvoie son adresse publique.
  async envoyerImage(emplacement: string, fichier: File): Promise<string> {
    const extension = fichier.name.split('.').pop()?.toLowerCase() || 'jpg';
    const chemin = `${emplacement}-${Date.now()}.${extension}`;

    const { error } = await this.supabase.storage.from('photos').upload(chemin, fichier);
    if (error) throw error;

    return this.supabase.storage.from('photos').getPublicUrl(chemin).data.publicUrl;
  }

}
