import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { PlusCircle, FileText, Eye, EyeOff, Pencil, Home, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/AppContext";
import { Image } from "@/components/ui/image";

const statusStyles = {
  Draft: "bg-muted text-foreground/60",
  Published: "bg-secondary text-primary",
  Unavailable: "bg-destructive/10 text-destructive",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, userListings, updateListing, deleteListing } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Listings</h1>
          <p className="mt-1 text-foreground/60">Manage your apartment listings, {user?.name?.split(" ")[0]}.</p>
        </div>
        <Button onClick={() => navigate("/list")} className="bg-primary hover:bg-primary/90 text-white self-start sm:self-auto">
          <PlusCircle className="w-4 h-4 mr-1.5" /> Create New Listing
        </Button>
      </div>

      {userListings.length === 0 ? (
        <div className="text-center bg-white rounded-3xl border border-border shadow-sm py-16 px-6">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold">No listings yet</h3>
          <p className="mt-2 text-foreground/60 max-w-sm mx-auto">When you list an apartment, it'll show up here. You can edit, preview, or mark it unavailable anytime.</p>
          <Button onClick={() => navigate("/list")} className="mt-6 bg-primary hover:bg-primary/90 text-white">
            <PlusCircle className="w-4 h-4 mr-1.5" /> List your first place
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {userListings.map((l) => (
            <div key={l.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col sm:flex-row">
              <Link to={`/listings/${l.id}`} className="sm:w-56 aspect-[16/10] sm:aspect-auto bg-secondary shrink-0 block overflow-hidden">
                <Image src={l.photos?.[l.coverIndex || 0] || l.photos?.[0]} alt={l.complexName} fittingType="fill" className="w-full h-full" />
              </Link>
              <div className="flex-1 p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyles[l.status] || statusStyles.Published}`}>{l.status}</span>
                    </div>
                    <Link to={`/listings/${l.id}`}>
                      <h3 className="font-bold text-lg hover:text-primary transition-colors">{l.complexName}</h3>
                    </Link>
                    <p className="text-sm text-foreground/50 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {l.city}, {l.state} · {l.universityNearby}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-extrabold text-primary">${l.monthlyRent}</p>
                    <p className="text-xs text-foreground/50">/month</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{l.bedrooms}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{l.bathrooms}</span>
                  {l.furnishedBool && <span className="text-xs px-2 py-0.5 rounded-full bg-muted">Furnished</span>}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{l.startDate} → {l.endDate}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/listings/${l.id}`)} className="text-primary border-primary/30">
                    <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/list?edit=${l.id}`)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  {l.status !== "Unavailable" ? (
                    <Button variant="outline" size="sm" onClick={() => updateListing(l.id, { status: "Unavailable" })}>
                      <EyeOff className="w-3.5 h-3.5 mr-1" /> Mark Unavailable
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => updateListing(l.id, { status: "Published" })}>
                      <Eye className="w-3.5 h-3.5 mr-1" /> Republish
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this listing? This cannot be undone.")) deleteListing(l.id); }} className="text-destructive hover:bg-destructive/5 ml-auto">
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center gap-2 text-sm text-foreground/50">
        <FileText className="w-4 h-4" /> Tip: listings save automatically and stay editable from this dashboard.
      </div>
    </div>
  );
}