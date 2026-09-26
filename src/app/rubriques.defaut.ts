// =========================================================
// TEXTES ET IMAGES DE L'ACCUEIL PAR DÉFAUT
//
// Affichés si la base ne répond pas. Le gérant modifie la
// version en ligne depuis l'espace admin (onglet Rubriques).
// Un champ à null n'existe pas pour cette rubrique.
// =========================================================

export interface Rubrique {
  emplacement: string;
  libelle: string;
  ordre: number;
  surtitre: string | null;
  titre: string | null;
  texte: string | null;
  icone: string | null;
  image_url: string | null;
  alt: string | null;
}

const rubrique = (r: Partial<Rubrique> & Pick<Rubrique, 'emplacement' | 'libelle' | 'ordre'>): Rubrique => ({
  surtitre: null,
  titre: null,
  texte: null,
  icone: null,
  image_url: null,
  alt: null,
  ...r
});

export const RUBRIQUES_PAR_DEFAUT: Rubrique[] = [
  rubrique({
    emplacement: 'hero', libelle: 'Haut de page', ordre: 1,
    surtitre: 'Pension animalière',
    titre: 'Shadobi & Co',
    texte: 'Une micro-entreprise passionée par le bien-être de vos animaux.'
  }),
  rubrique({
    emplacement: 'idee', libelle: 'Notre idée — titre', ordre: 2,
    surtitre: 'Notre idée',
    titre: 'Ici, votre animal sera libre comme l\'air.'
  }),
  rubrique({
    emplacement: 'idee-1', libelle: 'Notre idée — carte 1', ordre: 3,
    icone: '🦴',
    titre: 'Bien-être',
    texte: 'Le confort de votre animal est notre priorité, avec un environnement adapté à ses besoins et à son bien-être pour lui permettre de s\'épanouir pleinement.'
  }),
  rubrique({
    emplacement: 'idee-2', libelle: 'Notre idée — carte 2', ordre: 4,
    icone: '🐶',
    titre: 'Attention',
    texte: 'Chaque compagnon mérite une attention particulière et un accueil personnalisé.'
  }),
  rubrique({
    emplacement: 'idee-3', libelle: 'Notre idée — carte 3', ordre: 5,
    icone: '🏡',
    titre: 'Confiance',
    texte: 'Vous partez l\'esprit tranquille en sachant que votre compagnon est entre de bonnes mains.'
  }),
  rubrique({
    emplacement: 'promenades', libelle: 'Présentation — photo 1', ordre: 6,
    surtitre: 'Shadobi & Co',
    titre: 'Des promenades dynamiques !',
    texte: 'Vos animaux seront sortis régulièrement pour des promenades adaptées à leurs besoins et à leur rythme. Ils pourrons s\'y épanouir pleinement et découvrir de nouveaux environnements.',
    image_url: 'assets/images/IMG-20241002-WA0003.jpg',
    alt: 'Shadobi & Co - Accueil'
  }),
  rubrique({
    emplacement: 'terrain', libelle: 'Présentation — photo 2', ordre: 7,
    surtitre: 'Pour votre compagnon',
    titre: 'Un grand terrain pour se défouler et s\'amuser.',
    texte: 'Notre résidence est un terrain clos et sécurité. Il offre un grand espace d\'amusement adapté à chaque type d\'animaux.',
    image_url: 'assets/images/IMG_20260711_193906.jpg',
    alt: 'Compagnon accueilli chez Shadobi & Co'
  }),
  rubrique({
    emplacement: 'prestations', libelle: 'Prestations — titre', ordre: 8,
    surtitre: 'Nos services',
    titre: 'Découvrez nos prestations',
    texte: 'Des prestations pensées pour accompagner votre compagnon et répondre à ses besoins.'
  }),
  rubrique({
    emplacement: 'a-propos-titre', libelle: 'À propos — titre', ordre: 9,
    surtitre: 'À propos',
    titre: 'L\'histoire de Shadobi & Co'
  }),
  rubrique({
    emplacement: 'a-propos', libelle: 'À propos — photo 3', ordre: 10,
    surtitre: 'Shadobi & Co',
    titre: 'Une passion pour les animaux',
    texte: 'Shadobi & Co accompagne les propriétaires dans la prise en charge de leurs compagnons, avec une approche basée sur l\'écoute, le respect et le bien-être animal.',
    image_url: 'assets/images/IMG_20260424_100418.jpg',
    alt: 'À propos de Shadobi & Co'
  })
];

export const rubriquesParEmplacement = (liste: Rubrique[]): Record<string, Rubrique> =>
  Object.fromEntries(liste.map(r => [r.emplacement, r]));
