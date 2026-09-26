-- =========================================================
-- SHADOBI & CO — GALERIE PHOTO DE CHAQUE PRESTATION
--
-- À coller une seule fois dans Supabase > SQL Editor > New query,
-- puis cliquer sur « Run ». (Après 002_rubriques.sql.)
--
-- Pas de limite de photos. Si une prestation est supprimée,
-- ses photos le sont aussi.
-- =========================================================

create table if not exists public.prestation_photos (
  id             bigint generated always as identity primary key,
  prestation_id  bigint not null references public.prestations (id) on delete cascade,
  ordre          int    not null default 0,
  image_url      text   not null,
  titre          text   not null default '',
  description    text   not null default '',
  cree_le        timestamptz not null default now()
);

create index if not exists prestation_photos_prestation_idx
  on public.prestation_photos (prestation_id, ordre);

alter table public.prestation_photos enable row level security;

create policy "prestation_photos_lecture_publique" on public.prestation_photos
  for select using (true);

create policy "prestation_photos_gerant" on public.prestation_photos
  for all to authenticated
  using (public.est_gerant())
  with check (public.est_gerant());
