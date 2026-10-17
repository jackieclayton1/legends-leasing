import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/AppContext";
import { mockListings, amenitiesList, apartmentTypes } from "@/lib/mockData";
import ListingCard from "@/components/ListingCard";

export default function Browse() {
  const navigate = useNavigate();
  const { allListings } = useApp();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minRent: "", maxRent: "", moveIn: "", moveOut: "",
    bedrooms: "any", bathroom: "any", furnished: "any", petFriendly: false, amenities: [],
  });

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    return allListings.filter((l) => {
      if (query) {
        const q = query.toLowerCase();
        const hay = `${l.complexName} ${l.city} ${l.state} ${l.universityNearby} ${l.listerUniversity || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.minRent && Number(l.monthlyRent) < Number(filters.minRent)) return false;
      if (filters.maxRent && Number(l.monthlyRent) > Number(filters.maxRent)) return false;
      if (filters.bedrooms !== "any" && l.bedrooms !== filters.bedrooms) return false;
      if (filters.bathroom !== "any" && l.bathroomType !== filters.bathroom) return false;
      if (filters.furnished !== "any") {
        const wantFurnished = filters.furnished === "yes";
        if (l.furnishedBool !== wantFurnished) return false;
      }
      if (filters.petFriendly && !l.petFriendly) return false;
      if (filters.moveIn && l.endDate < filters.moveIn) return false;
      if (filters.moveOut && l.startDate > filters.moveOut) return false;
      if (filters.amenities.length && !filters.amenities.every((a) => l.amenities?.includes(a))) return false;
      return l.status !== "Unavailable";
    });
  }, [allListings, query, filters]);

  const activeFilterCount = [filters.minRent, filters.maxRent, filters.moveIn, filters.moveOut].filter(Boolean).length
    + (filters.bedrooms !== "any" ? 1 : 0) + (filters.bathroom !== "any" ? 1 : 0)
    + (filters.furnished !== "any" ? 1 : 0) + (filters.petFriendly ? 1 : 0) + filters.amenities.length;

  const reset = () => setFilters({ minRent: "", maxRent: "", moveIn: "", moveOut: "", bedrooms: "any", bathroom: "any", furnished: "any", petFriendly: false, amenities: [] });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Browse Tuscaloosa subleases</h1>
          <p className="mt-1 text-foreground/60">{filtered.length} {filtered.length === 1 ? "place" : "places"} available near UA campus.</p>
        </div>
        <Button onClick={() => navigate("/list")} className="bg-primary hover:bg-primary/90 text-white self-start sm:self-auto">
          List your place
        </Button>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-foreground/40" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by building, street, or neighborhood" className="pl-11 h-12" />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="h-12 px-4 border-primary/30 text-primary relative">
          <SlidersHorizontal className="w-4 h-4 mr-1.5" /> Filters
          {activeFilterCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{activeFilterCount}</span>}
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Filter results</h3>
            {activeFilterCount > 0 && <button onClick={reset} className="text-sm text-primary hover:underline flex items-center gap-1"><X className="w-3.5 h-3.5" /> Clear all</button>}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/60">Min rent ($/mo)</Label>
              <Input type="number" min="0" value={filters.minRent} onChange={(e) => setF("minRent", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/60">Max rent ($/mo)</Label>
              <Input type="number" min="0" value={filters.maxRent} onChange={(e) => setF("maxRent", e.target.value)} placeholder="2000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/60">Move-in by</Label>
              <Input type="date" value={filters.moveIn} onChange={(e) => setF("moveIn", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/60">Move-out by</Label>
              <Input type="date" value={filters.moveOut} onChange={(e) => setF("moveOut", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/60">Bedrooms</Label>
              <select value={filters.bedrooms} onChange={(e) => setF("bedrooms", e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="any">Any</option>
                {apartmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/60">Bathroom</Label>
              <select value={filters.bathroom} onChange={(e) => setF("bathroom", e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="any">Any</option>
                <option value="private">Private</option>
                <option value="shared">Shared</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/60">Furnished</Label>
              <select value={filters.furnished} onChange={(e) => setF("furnished", e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="any">Any</option>
                <option value="yes">Furnished only</option>
                <option value="no">Unfurnished only</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer h-10">
                <input type="checkbox" checked={filters.petFriendly} onChange={(e) => setF("petFriendly", e.target.checked)} className="w-4 h-4 rounded accent-primary" />
                <span className="text-sm font-medium">Pet-friendly only</span>
              </label>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Label className="text-xs font-semibold text-foreground/60 mb-2 block">Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map((a) => {
                const active = filters.amenities.includes(a);
                return (
                  <button key={a} onClick={() => setF("amenities", active ? filters.amenities.filter((x) => x !== a) : [...filters.amenities, a])}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active ? "bg-primary text-white border-primary" : "bg-white text-foreground/70 border-border hover:border-primary/50"}`}>
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold">No matches found</h3>
          <p className="mt-1 text-foreground/60 text-sm">Try adjusting your search or clearing some filters.</p>
          {activeFilterCount > 0 && <Button variant="outline" onClick={reset} className="mt-5 border-primary/30 text-primary">Clear filters</Button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}