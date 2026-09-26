-- =========================================================
-- SHADOBI & CO — RUBRIQUES DE L'ACCUEIL MODIFIABLES
--
-- À coller une seule fois dans Supabase > SQL Editor > New query,
-- puis cliquer sur « Run ». (Après schema.sql.)
--
-- Un champ à null n'existe pas pour cette rubrique
-- (ex. pas d'image pour les cartes « Notre idée »).
-- =========================================================

create table if not exists public.rubriques (
  emplacement text primary key,
  libelle     text not null,
  ordre       int  not null default 0,
  surtitre    text,
  titre       text,
  texte       text,
  icone       text,
  image_url   text,
  alt         text
);

alter table public.rubriques enable row level security;

create policy "rubriques_lecture_publique" on public.rubriques
  for select using (true);

create policy "rubriques_gerant" on public.rubriques
  for all to authenticated
  using (public.est_gerant())
  with check (public.est_gerant());


insert into public.rubriques (emplacement, libelle, ordre, surtitre, titre, texte, icone, image_url, alt) values
  ('hero', 'Haut de page', 1,
   'Pension animalière', 'Shadobi & Co',
   'Une micro-entreprise passionée par le bien-être de vos animaux.',
   null, null, null),
  ('idee', 'Notre idée — titre', 2,
   'Notre idée', 'Ici, votre animal sera libre comme l''air.', null,
   null, null, null),
  ('idee-1', 'Notre idée — carte 1', 3,
   null, 'Bien-être',
   'Le confort de votre animal est notre priorité, avec un environnement adapté à ses besoins et à son bien-être pour lui permettre de s''épanouir pleinement.',
   '🦴', null, null),
  ('idee-2', 'Notre idée — carte 2', 4,
   null, 'Attention',
   'Chaque compagnon mérite une attention particulière et un accueil personnalisé.',
   '🐶', null, null),
  ('idee-3', 'Notre idée — carte 3', 5,
   null, 'Confiance',
   'Vous partez l''esprit tranquille en sachant que votre compagnon est entre de bonnes mains.',
   '🏡', null, null),
  ('promenades', 'Présentation — photo 1', 6,
   'Shadobi & Co', 'Des promenades dynamiques !',
   'Vos animaux seront sortis régulièrement pour des promenades adaptées à leurs besoins et à leur rythme. Ils pourrons s''y épanouir pleinement et découvrir de nouveaux environnements.',
   null, 'assets/images/IMG-20241002-WA0003.jpg', 'Shadobi & Co - Accueil'),
  ('terrain', 'Présentation — photo 2', 7,
   'Pour votre compagnon', 'Un grand terrain pour se défouler et s''amuser.',
   'Notre résidence est un terrain clos et sécurité. Il offre un grand espace d''amusement adapté à chaque type d''animaux.',
   null, 'assets/images/IMG_20260711_193906.jpg', 'Compagnon accueilli chez Shadobi & Co'),
  ('prestations', 'Prestations — titre', 8,
   'Nos services', 'Découvrez nos prestations',
   'Des prestations pensées pour accompagner votre compagnon et répondre à ses besoins.',
   null, null, null),
  ('a-propos-titre', 'À propos — titre', 9,
   'À propos', 'L''histoire de Shadobi & Co', null,
   null, null, null),
  ('a-propos', 'À propos — photo 3', 10,
   'Shadobi & Co', 'Une passion pour les animaux',
   'Shadobi & Co accompagne les propriétaires dans la prise en charge de leurs compagnons, avec une approche basée sur l''écoute, le respect et le bien-être animal.',
   null, 'assets/images/IMG_20260424_100418.jpg', 'À propos de Shadobi & Co')
on conflict (emplacement) do nothing;


-- Reprend les photos déjà changées depuis l'onglet « Photos ».
update public.rubriques r
set image_url = p.url,
    alt       = p.alt
from public.photos p
where p.emplacement = r.emplacement;
