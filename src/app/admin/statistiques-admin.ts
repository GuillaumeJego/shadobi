import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { DonneesService, Statistiques } from '../donnees.service';

interface Courbe {
  cle: 'visiteurs' | 'pages' | 'reservations';
  nom: string;
  couleur: string;
}

// Dimensions du graphique (unités du viewBox SVG).
const L = 800;
const H = 280;
const MARGE = { haut: 16, droite: 16, bas: 34, gauche: 40 };

// Onglet « Statistiques » de l'espace gérant.
@Component({
  selector: 'app-statistiques-admin',
  template: `
    <div class="periodes">
      @for (n of [7, 30, 90]; track n) {
        <button type="button" [class.active]="nbJours() === n" (click)="changerPeriode(n)">
          {{ n }} derniers jours
        </button>
      }
    </div>

    @if (erreur()) {
      <p class="erreur">{{ erreur() }}</p>
    }

    @if (stats(); as s) {

      <div class="totaux">
        <div><strong>{{ s.totaux.visiteurs }}</strong><span>visiteurs</span></div>
        <div><strong>{{ s.totaux.pages }}</strong><span>pages vues</span></div>
        <div><strong>{{ s.totaux.reservations }}</strong><span>clics « réservation »</span></div>
      </div>

      <div class="carte">
        <div class="legende">
          @for (c of courbes; track c.cle) {
            <span><i [style.background]="c.couleur"></i>{{ c.nom }}</span>
          }
        </div>

        <svg [attr.viewBox]="'0 0 ' + L + ' ' + H" role="img" aria-label="Évolution des visites par jour">

          @for (g of graduations(); track g.valeur) {
            <line [attr.x1]="MARGE.gauche" [attr.x2]="L - MARGE.droite" [attr.y1]="g.y" [attr.y2]="g.y" class="grille" />
            <text [attr.x]="MARGE.gauche - 8" [attr.y]="g.y + 4" text-anchor="end">{{ g.valeur }}</text>
          }

          @for (e of etiquettes(); track e.x) {
            <text [attr.x]="e.x" [attr.y]="H - 10" text-anchor="middle">{{ e.texte }}</text>
          }

          @for (c of courbes; track c.cle) {
            <polyline [attr.points]="points(c.cle)" [attr.stroke]="c.couleur" fill="none" stroke-width="2.5" stroke-linejoin="round" />
            @if (s.jours.length <= 31) {
              @for (j of s.jours; track j.jour; let i = $index) {
                <circle [attr.cx]="x(i)" [attr.cy]="y(j[c.cle])" r="3.5" [attr.fill]="c.couleur">
                  <title>{{ dateCourte(j.jour) }} : {{ j[c.cle] }} {{ c.nom.toLowerCase() }}</title>
                </circle>
              }
            }
          }

        </svg>
      </div>

      <div class="carte">
        <h3>Pages les plus vues</h3>
        <table>
          @for (p of s.pages; track p.page) {
            <tr><td>{{ nomDePage(p.page, p.titre) }}</td><td>{{ p.vues }}</td></tr>
          } @empty {
            <tr><td>Aucune visite sur la période.</td></tr>
          }
        </table>
      </div>

    } @else if (!erreur()) {
      <p>Chargement…</p>
    }
  `,
  styles: `
    .periodes { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
    button { padding: 8px 14px; border: none; border-radius: 18px; background: #f3ebe2; font: inherit; font-weight: 600; cursor: pointer; }
    button.active { background: #f28c28; color: white; }
    .totaux { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; margin-bottom: 18px; }
    .totaux div, .carte { padding: 18px 20px; background: white; border-radius: 18px; box-shadow: 0 6px 20px rgba(80, 50, 20, 0.07); }
    .carte { margin-bottom: 18px; }
    .totaux strong { display: block; color: #f28c28; font-size: 32px; }
    .totaux span { color: #6f6860; font-size: 14px; }
    .legende { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 8px; font-size: 14px; color: #6f6860; }
    .legende i { display: inline-block; width: 12px; height: 12px; margin-right: 6px; border-radius: 3px; vertical-align: -1px; }
    svg { display: block; width: 100%; height: auto; }
    svg text { fill: #938b82; font-size: 12px; }
    .grille { stroke: #f1e5d8; }
    h3 { margin: 0 0 10px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px 0; border-bottom: 1px solid #f5ede4; }
    td:last-child { text-align: right; font-weight: 600; }
    .erreur { color: #b3372a; }
  `
})
export class StatistiquesAdmin implements OnInit {

  private donnees = inject(DonneesService);

  readonly L = L;
  readonly H = H;
  readonly MARGE = MARGE;

  readonly courbes: Courbe[] = [
    { cle: 'visiteurs', nom: 'Visiteurs', couleur: '#f28c28' },
    { cle: 'pages', nom: 'Pages vues', couleur: '#c9b8a6' },
    { cle: 'reservations', nom: 'Clics réservation', couleur: '#3b9a5b' }
  ];

  nbJours = signal(30);
  stats = signal<Statistiques | null>(null);
  erreur = signal('');

  // Plus grande valeur affichée, arrondie vers le haut.
  private max = computed(() => {
    const jours = this.stats()?.jours ?? [];
    const plusGrand = Math.max(1, ...jours.map(j => Math.max(j.visiteurs, j.pages, j.reservations)));
    const pas = Math.pow(10, Math.floor(Math.log10(plusGrand)));
    return Math.ceil(plusGrand / pas) * pas;
  });

  graduations = computed(() => {
    const max = this.max();
    return [0, 0.25, 0.5, 0.75, 1]
      .map(f => Math.round(max * f))
      .filter((v, i, t) => t.indexOf(v) === i)
      .map(valeur => ({ valeur, y: this.y(valeur) }));
  });

  // Environ 7 dates sous l'axe, quelle que soit la période.
  etiquettes = computed(() => {
    const jours = this.stats()?.jours ?? [];
    const pas = Math.max(1, Math.ceil(jours.length / 7));
    return jours
      .map((j, i) => ({ i, j }))
      .filter(({ i }) => i % pas === 0 || i === jours.length - 1)
      .map(({ i, j }) => ({ x: this.x(i), texte: this.dateCourte(j.jour) }));
  });

  ngOnInit(): void {
    this.charger();
  }

  changerPeriode(n: number): void {
    this.nbJours.set(n);
    this.charger();
  }

  async charger(): Promise<void> {
    this.erreur.set('');
    try {
      this.stats.set(await this.donnees.statistiques(this.nbJours()));
    } catch (e) {
      console.error(e);
      this.erreur.set(`Impossible de charger les statistiques : ${(e as Error).message}`);
    }
  }

  x(index: number): number {
    const n = this.stats()?.jours.length ?? 1;
    const largeur = L - MARGE.gauche - MARGE.droite;
    return MARGE.gauche + (n <= 1 ? largeur / 2 : (index * largeur) / (n - 1));
  }

  y(valeur: number): number {
    const hauteur = H - MARGE.haut - MARGE.bas;
    return MARGE.haut + hauteur - (valeur / this.max()) * hauteur;
  }

  points(cle: Courbe['cle']): string {
    return (this.stats()?.jours ?? []).map((j, i) => `${this.x(i)},${this.y(j[cle])}`).join(' ');
  }

  dateCourte(jour: string): string {
    const [, mois, j] = jour.split('-');
    return `${j}/${mois}`;
  }

  nomDePage(page: string, titre: string): string {
    if (page === '/') return 'Accueil';
    if (page === '/prestations') return 'Page Prestations';
    if (page === '/reservation') return 'Réservation (bientôt disponible)';
    if (titre) return `Prestation : ${titre}`;
    return page;
  }

}
