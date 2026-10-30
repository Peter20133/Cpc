/**
 * Adapter către clientul de bază de date al proiectului.
 *
 * Aplicația a fost portată pe Lovable Cloud: clientul este generat în
 * `src/integrations/supabase/client.ts`, iar drepturile de administrator sunt
 * verificate prin funcția `has_role` (tabelul separat `user_roles`).
 */

import type { Session } from "@supabase/supabase-js";
import { supabase as generatedClient } from "@/integrations/supabase/client";

const checkSupabaseConfigured = (): boolean => {
  try {
    const url = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== "undefined" && process.env?.SUPABASE_URL);
    const key = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) || (typeof process !== "undefined" && process.env?.SUPABASE_PUBLISHABLE_KEY);
    return Boolean(url && key);
  } catch {
    return false;
  }
};

export const supabase = generatedClient;
export const isSupabaseConfigured = checkSupabaseConfigured();

function requireSupabase() {
  return generatedClient;
}

async function userIsAdmin(userId: string): Promise<boolean> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (error) throw new Error(`Nu am putut verifica drepturile de administrator: ${error.message}`);
  return data === true;
}

export async function signInAdmin(email: string, password: string): Promise<Session> {
  const db = requireSupabase();
  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (error) throw new Error(`Autentificarea a eșuat: ${error.message}`);
  if (!data.user || !data.session) throw new Error("Autentificarea nu a returnat o sesiune validă.");

  if (!(await userIsAdmin(data.user.id))) {
    await db.auth.signOut();
    throw new Error("Acest cont nu are drepturi de administrator.");
  }

  return data.session;
}

export async function restoreAdminSession(): Promise<boolean> {
  const db = requireSupabase();
  const { data, error } = await db.auth.getSession();
  if (error) throw new Error(`Nu am putut restaura sesiunea: ${error.message}`);
  if (!data.session?.user) return false;

  const admin = await userIsAdmin(data.session.user.id);
  if (!admin) {
    await db.auth.signOut();
    return false;
  }
  return true;
}

export async function signOutAdmin(): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.auth.signOut();
  if (error) throw new Error(`Deconectarea a eșuat: ${error.message}`);
}
