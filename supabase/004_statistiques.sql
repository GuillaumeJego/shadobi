-- =========================================================
-- SHADOBI & CO — STATISTIQUES DE VISITE
--
-- À coller une seule fois dans Supabase > SQL Editor > New query,
-- puis cliquer sur « Run ». (Après 003_galeries.sql.)
--
-- Mesure d'audience anonyme : aucune donnée personnelle,
-- seulement un identifiant aléatoire par visite (onglet du
-- navigateur), la page vue et la date.
-- =========================================================

create table if not exists public.visites (
  id        bigint generated always as identity primary key,
  cree_le   timestamptz not null default now(),
  session   text not null check (char_length(session) between 8 and 40),
  type      text not null check (type in ('page', 'reservation')),
  page      text not null check (char_length(page) between 1 and 200)
);

create index if not exists visites_date_idx on public.visites (cree_le);

alter table public.visites enable row level security;

-- Tout visiteur peut enregistrer sa visite…
create policy "visites_enregistrement_public" on public.visites
  for insert to anon, authenticated
  with check (cree_le > now() - interval '1 minute');

-- …mais seul le gérant peut lire les statistiques.
create policy "visites_lecture_gerant" on public.visites
  for select to authenticated
  using (public.est_gerant());


-- ---------------------------------------------------------
-- Statistiques pour l'espace admin, sur les N derniers jours
-- (heure de Paris). Renvoie :
--   jours : [{ jour, visiteurs, pages, reservations }]
--   pages : [{ page, titre, vues }]
--   totaux : { visiteurs, pages, reservations }
-- ---------------------------------------------------------

create or replace function public.statistiques(nb_jours int default 30)
returns json
language sql
stable
security invoker
set search_path = public
as $$
  with periode as (
    select
      (now() at time zone 'Europe/Paris')::date - (nb_jours - 1) as debut,
      (now() at time zone 'Europe/Paris')::date as fin
  ),
  v as (
    select *, (cree_le at time zone 'Europe/Paris')::date as jour
    from visites, periode
    where (cree_le at time zone 'Europe/Paris')::date between periode.debut and periode.fin
  ),
  jours as (
    select
      d::date as jour,
      count(distinct v.session) filter (where v.type = 'page')        as visiteurs,
      count(v.id)               filter (where v.type = 'page')        as pages,
      count(v.id)               filter (where v.type = 'reservation') as reservations
    from periode, generate_series(periode.debut, periode.fin, interval '1 day') d
    left join v on v.jour = d::date
    group by d
    order by d
  ),
  pages as (
    select
      v.page,
      coalesce(p.titre, '') as titre,
      count(*) as vues
    from v
    left join prestations p
      on v.page ~ '^/prestations/[0-9]+$'
     and p.id = substring(v.page from '[0-9]+$')::bigint
    where v.type = 'page'
    group by v.page, p.titre
    order by vues desc
    limit 20
  )
  select json_build_object(
    'jours',  coalesce((select json_agg(jours) from jours), '[]'::json),
    'pages',  coalesce((select json_agg(pages) from pages), '[]'::json),
    'totaux', json_build_object(
      'visiteurs',    (select count(distinct session) from v where type = 'page'),
      'pages',        (select count(*) from v where type = 'page'),
      'reservations', (select count(*) from v where type = 'reservation')
    )
  );
$$;

notify pgrst, 'reload schema';
