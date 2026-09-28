-- =========================================================
-- SHADOBI & CO — AVIS RATTACHÉS À UNE PRESTATION
--
-- À coller une seule fois dans Supabase > SQL Editor > New query,
-- puis cliquer sur « Run ». (Après 004_statistiques.sql.)
--
-- Un avis laissé depuis la page d'une prestation est rattaché
-- à cette prestation. Les avis de l'accueil restent généraux.
-- Si la prestation est supprimée, l'avis est conservé.
-- =========================================================

alter table public.avis
  add column if not exists prestation_id bigint
  references public.prestations (id) on delete set null;

create index if not exists avis_prestation_idx on public.avis (prestation_id);

notify pgrst, 'reload schema';
