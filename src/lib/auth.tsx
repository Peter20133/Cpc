import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Ownership = { id: string; restaurant_id: number; status: string; restaurantName?: string };

type AuthState = {
  user: User | null;
  ready: boolean;
  isAdmin: boolean;
  ownerships: Ownership[];
  approvedRestaurantIds: number[];
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>({ user: null, ready: false, isAdmin: false, ownerships: [], approvedRestaurantIds: [], reload: async () => {}, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ownerships, setOwnerships] = useState<Ownership[]>([]);

  const loadExtras = useCallback(async (u: User | null) => {
    if (!u) { setIsAdmin(false); setOwnerships([]); return; }
    const [{ data: admin }, { data: owns }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: u.id, _role: "admin" }),
      supabase.from("restaurant_owners").select("id, restaurant_id, status, restaurants(name)").eq("user_id", u.id),
    ]);
    setIsAdmin(admin === true);
    setOwnerships((owns ?? []).map((o: any) => ({ id: o.id, restaurant_id: o.restaurant_id, status: o.status, restaurantName: o.restaurants?.name })));
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      await loadExtras(data.user ?? null).catch(() => {});
      if (active) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const u = session?.user ?? null;
      setUser(u);
      setTimeout(() => { void loadExtras(u).catch(() => {}); }, 0);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [loadExtras]);

  const reload = useCallback(async () => { await loadExtras(user); }, [loadExtras, user]);
  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  return (
    <Ctx.Provider value={{ user, ready, isAdmin, ownerships, approvedRestaurantIds: ownerships.filter((o) => o.status === "approved").map((o) => o.restaurant_id), reload, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
