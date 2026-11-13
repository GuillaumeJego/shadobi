-- =========================================================
-- SHADOBI & CO — LIEN DE RÉSERVATION PAR PRESTATION
--
-- À coller une seule fois dans Supabase > SQL Editor > New query,
-- puis cliquer sur « Run ». (Après 004_statistiques.sql.)
--
-- Laissé vide, le bouton « Prendre ma réservation » de la
-- prestation garde le lien général (src/app/reservation.config.ts).
-- =========================================================

alter table public.prestations
  add column if not exists lien_reservation text not null default '';
