import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { mockListings } from "./mockData";
import { useAuth } from "@/lib/AuthContext";

const AppContext = createContext(null);
const LISTINGS_KEY = "sublet_listings";
const FAV_KEY = "sublet_favorites";
const DRAFT_KEY = "sublet_draft";

function readLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const { user, logout: authLogout } = useAuth();
  const [userListings, setUserListings] = useState(() => readLS(LISTINGS_KEY, []));
  const [favorites, setFavorites] = useState(() => readLS(FAV_KEY, []));
  const [draft, setDraft] = useState(() => readLS(DRAFT_KEY, null));

  useEffect(() => { localStorage.setItem(LISTINGS_KEY, JSON.stringify(userListings)); }, [userListings]);
  useEffect(() => { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }, [draft]);

  const logout = useCallback(() => { authLogout(); }, [authLogout]);

  const allListings = [...userListings, ...mockListings];

  const saveDraft = useCallback((data) => setDraft(data), []);
  const clearDraft = useCallback(() => setDraft(null), []);

  const addListing = useCallback((listing) => {
    const full = { ...listing, id: "usr-" + Date.now(), listerEmail: user?.email, listerName: user?.name, listerUniversity: user?.university, createdAt: new Date().toISOString(), status: listing.status || "Published" };
    setUserListings((prev) => [full, ...prev]);
    return full;
  }, [user]);

  const updateListing = useCallback((id, data) => {
    setUserListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
  }, []);

  const deleteListing = useCallback((id) => {
    setUserListings((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const getListing = useCallback((id) => {
    return userListings.find((l) => l.id === id) || mockListings.find((l) => l.id === id);
  }, [userListings]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  return (
    <AppContext.Provider value={{
      user, logout,
      allListings, userListings, addListing, updateListing, deleteListing, getListing,
      favorites, toggleFavorite, isFavorite,
      draft, saveDraft, clearDraft,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}