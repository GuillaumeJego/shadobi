// =========================================================
// ROBOT ANTI-PAUSE SUPABASE
//
// Sur l'offre gratuite, Supabase met le projet en pause après
// 7 jours sans activité. Netlify exécute cette fonction chaque
// jour : elle lit une ligne de la base pour la garder éveillée.
// =========================================================

import type { Config } from '@netlify/functions';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../../src/app/supabase.config';

export default async () => {
  const reponse = await fetch(`${SUPABASE_URL}/rest/v1/prestations?select=id&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY }
  });

  console.log(`Supabase keep-alive : HTTP ${reponse.status}`);
};

export const config: Config = {
  schedule: '@daily'
};
