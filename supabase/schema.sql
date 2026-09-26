-- =========================================================
-- SHADOBI & CO — BASE DE DONNÉES SUPABASE
--
-- À coller une seule fois dans Supabase > SQL Editor > New query,
-- puis cliquer sur « Run ».
-- =========================================================


-- ---------------------------------------------------------
-- GÉRANTS : seuls les e-mails listés ici peuvent modifier le site
-- ---------------------------------------------------------

create table if not exists public.gerants (
  email text primary key
);

alter table public.gerants enable row level security;

create or replace function public.est_gerant()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.gerants
    where email = (auth.jwt() ->> 'email')
  );
$$;

create policy "gerants_lecture" on public.gerants
  for select to authenticated
  using (public.est_gerant());


-- ---------------------------------------------------------
-- PRESTATIONS ET TARIFS
-- tarifs : liste de { "prix": "15 €", "duree": "/ 30 min" }
-- ---------------------------------------------------------

create table if not exists public.prestations (
  id          bigint generated always as identity primary key,
  ordre       int     not null default 0,
  icone       text    not null default '🐾',
  categorie   text    not null default '',
  titre       text    not null,
  description text    not null default '',
  tarifs      jsonb   not null default '[]'::jsonb,
  note        text    not null default '',
  visible     boolean not null default true
);

alter table public.prestations enable row level security;

create policy "prestations_lecture_publique" on public.prestations
  for select using (visible or public.est_gerant());

create policy "prestations_gerant" on public.prestations
  for all to authenticated
  using (public.est_gerant())
  with check (public.est_gerant());


-- ---------------------------------------------------------
-- PHOTOS DU SITE (une ligne par emplacement)
-- ---------------------------------------------------------

create table if not exists public.photos (
  emplacement text primary key,
  libelle     text not null,
  url         text not null,
  alt         text not null default ''
);

alter table public.photos enable row level security;

create policy "photos_lecture_publique" on public.photos
  for select using (true);

create policy "photos_gerant" on public.photos
  for all to authenticated
  using (public.est_gerant())
  with check (public.est_gerant());


-- ---------------------------------------------------------
-- AVIS CLIENTS
-- Tout le monde peut en déposer un, il n'apparaît
-- qu'une fois validé par le gérant.
-- ---------------------------------------------------------

create table if not exists public.avis (
  id         bigint generated always as identity primary key,
  cree_le    timestamptz not null default now(),
  nom        text not null check (char_length(nom) between 1 and 60),
  note       int  not null check (note between 1 and 5),
  message    text not null check (char_length(message) between 5 and 1000),
  valide     boolean not null default false
);

alter table public.avis enable row level security;

create policy "avis_lecture_publique" on public.avis
  for select using (valide or public.est_gerant());

create policy "avis_depot_public" on public.avis
  for insert to anon, authenticated
  with check (valide = false);

create policy "avis_gerant_modif" on public.avis
  for update to authenticated
  using (public.est_gerant())
  with check (public.est_gerant());

create policy "avis_gerant_suppr" on public.avis
  for delete to authenticated
  using (public.est_gerant());


-- ---------------------------------------------------------
-- STOCKAGE DES PHOTOS (bucket public en lecture)
-- ---------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos_storage_gerant_ajout" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and public.est_gerant());

create policy "photos_storage_gerant_modif" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and public.est_gerant());

create policy "photos_storage_gerant_suppr" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and public.est_gerant());


-- =========================================================
-- CONTENU DE DÉPART (repris du site actuel)
-- =========================================================

insert into public.gerants (email) values
  ('shadobiandco@gmail.com'),
  ('metanafr@gmail.com')
on conflict do nothing;

insert into public.photos (emplacement, libelle, url, alt) values
  ('promenades', 'Accueil — Des promenades dynamiques', 'assets/images/IMG-20241002-WA0003.jpg', 'Shadobi & Co - Accueil'),
  ('terrain',    'Accueil — Un grand terrain',          'assets/images/IMG_20260711_193906.jpg', 'Compagnon accueilli chez Shadobi & Co'),
  ('a-propos',   'À propos — Une passion',              'assets/images/IMG_20260424_100418.jpg', 'À propos de Shadobi & Co')
on conflict (emplacement) do nothing;

insert into public.prestations (ordre, icone, categorie, titre, description, tarifs, note) values
  (1, '🐕', 'Éducation', 'Éducation',
   'Je vous accompagne dans l''éducation de votre chiot grâce à une méthode positive et respectueuse de son bien-être. Chaque apprentissage est adapté à son caractère, à vos objectifs et au lien que vous souhaitez construire avec lui.',
   '[{"prix":"50 €","duree":"/ 45 minutes"}]', ''),
  (2, '🧠', 'Accompagnement', 'Comportementalisme canin',
   'Un accompagnement personnalisé pour mieux comprendre les comportements de votre chien et vous aider à trouver des solutions adaptées.',
   '[{"prix":"60 €","duree":"/ 1h30 à 2h"}]', ''),
  (3, '🐶', 'Nouveau compagnon', 'Arrivée d''un chiot',
   'Un accompagnement pour préparer l''arrivée de votre chiot et partir sur de bonnes bases dès les premiers jours.',
   '[{"prix":"60 €","duree":"/ 1h30"}]', ''),
  (4, '🌿', 'Extérieur', 'Promenades',
   'Des promenades adaptées aux besoins et au rythme de votre compagnon.',
   '[{"prix":"15 €","duree":"/ 30 min"},{"prix":"18 €","duree":"/ 1h"},{"prix":"25 €","duree":"/ 1h30"}]', ''),
  (5, '🚕', 'Transport', 'Taxi animalier',
   'Un service de transport pour faciliter les déplacements de votre compagnon.',
   '[{"prix":"Tarif sur demande","duree":""}]', ''),
  (6, '🏡', 'Garde', 'Garderie',
   'Une solution pour accueillir votre compagnon pendant la journée lorsque vous ne pouvez pas être présent.',
   '[{"prix":"20 €","duree":"/ jour"}]', ''),
  (7, '🏠', 'Séjour', 'Pension',
   'Votre compagnon est accueilli pendant votre absence dans un environnement adapté à ses besoins.',
   '[{"prix":"25 €","duree":"/ jour"}]', 'Arrivée avant 9h · Départ vers 17h–18h. Se conférer aux Conditions Générales de Vente.'),
  (8, '🐾', 'À domicile', 'Petsitting',
   'Une présence et une attention adaptées à votre compagnon pendant votre absence.',
   '[{"prix":"25 €","duree":"/ jour"}]', '+ 5 € par animal supplémentaire. + 0,70 € / km si plus de 10 km autour de Saint Brandan.');
