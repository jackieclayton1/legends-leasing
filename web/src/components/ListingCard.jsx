import { Link } from "react-router-dom";
import { MapPin, Heart, BedDouble, Bath, Calendar, Check } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { defaultListingPhoto } from "@/lib/mockData";
import { Image } from "@/components/ui/image";

export default function ListingCard({ listing }) {
  const { isFavorite, toggleFavorite } = useApp();
  const fav = isFavorite(listing.id);
  const photos = listing.photos?.length ? listing.photos : [defaultListingPhoto];

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
      <Link to={`/listings/${listing.id}`} className="relative aspect-[4/3] overflow-hidden bg-secondary block">
        <Image src={photos[listing.coverIndex || 0] || photos[0]} alt={listing.complexName} fittingType="fill" className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
        <button
          onClick={(e) => { e.preventDefault(); toggleFavorite(listing.id); }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          aria-label={fav ? "Remove from favorites" : "Save listing"}
        >
          <Heart className={`w-4.5 h-4.5 ${fav ? "fill-accent text-accent" : "text-foreground/60"}`} />
        </button>
        {listing.landlordApproved === "Yes" && (
          <span className="absolute top-3 left-3 bg-primary/90 text-white text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" /> Landlord approved
          </span>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-xs text-foreground/50 mb-1">
          <MapPin className="w-3 h-3" /> {listing.city}, {listing.state}
        </div>
        <Link to={`/listings/${listing.id}`}>
          <h3 className="font-bold text-base leading-snug hover:text-primary transition-colors line-clamp-1">{listing.complexName}</h3>
        </Link>
        <p className="text-xs text-foreground/50 truncate mt-0.5">{listing.universityNearby}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-foreground/60">
          <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {listing.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {listing.bathrooms}</span>
          {listing.furnishedBool && <span className="text-primary font-medium">Furnished</span>}
        </div>
        <div className="flex items-center gap-1 text-xs text-foreground/50 mt-2">
          <Calendar className="w-3 h-3" /> {listing.startDate} → {listing.endDate}
        </div>
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <div>
            <span className="text-xl font-extrabold text-primary">${listing.monthlyRent}</span>
            <span className="text-xs text-foreground/50">/mo</span>
          </div>
          <Link to={`/listings/${listing.id}`} className="text-sm font-semibold text-primary hover:underline">
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}