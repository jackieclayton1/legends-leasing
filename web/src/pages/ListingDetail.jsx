import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, BedDouble, Bath, Calendar, Check, Heart, Share2, MessageSquare, ShieldCheck, Wifi, Car, Dumbbell, Waves, Dog, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/AppContext";
import { Image } from "@/components/ui/image";

const amenityIcon = {
  "Wi-Fi": Wifi, "Parking": Car, "Gym": Dumbbell, "Pool": Waves, "Pet-friendly": Dog,
};

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getListing, isFavorite, toggleFavorite, user } = useApp();
  const listing = getListing(id);
  const [activePhoto, setActivePhoto] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  if (!listing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Listing not found</h1>
        <p className="mt-2 text-foreground/60">This listing may have been removed.</p>
        <Button onClick={() => navigate("/browse")} className="mt-6 bg-primary text-white">Back to Browse</Button>
      </div>
    );
  }

  const photos = listing.photos?.length ? listing.photos : ["https://images.unsplash.com/photo-1560448356-efd5e0ecf6d7?w=800&q=80"];
  const fav = isFavorite(listing.id);

  const sendMessage = () => {
    setSent(true);
    setTimeout(() => { setSent(false); setContactOpen(false); setMessage(""); }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <Link to="/browse" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Browse
      </Link>

      {/* Gallery */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-3 mb-6">
        <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-secondary">
          <Image src={photos[activePhoto]} alt={listing.complexName} fittingType="fill" className="w-full h-full" />
        </div>
        <div className="hidden lg:grid grid-rows-2 gap-3">
          {photos.slice(1, 3).map((p, i) => (
            <button key={i} onClick={() => setActivePhoto(i + 1)} className="rounded-2xl overflow-hidden aspect-[16/10] bg-secondary">
              <Image src={p} alt="" fittingType="fill" className="w-full h-full" />
            </button>
          ))}
        </div>
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
          {photos.map((p, i) => (
            <button key={i} onClick={() => setActivePhoto(i)} className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${activePhoto === i ? "border-primary" : "border-transparent"}`}>
              <img src={p} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
        {/* Main info */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {listing.landlordApproved === "Yes" && <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Landlord approved</span>}
                {listing.landlordApproved === "Pending" && <span className="bg-accent/20 text-accent-foreground text-xs font-semibold px-2 py-0.5 rounded-full">Approval pending</span>}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{listing.complexName}</h1>
              <p className="mt-1 text-foreground/60 flex items-center gap-1"><MapPin className="w-4 h-4" /> {listing.city}, {listing.state} · {listing.universityNearby}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleFavorite(listing.id)} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary" aria-label="Save">
                <Heart className={`w-5 h-5 ${fav ? "fill-accent text-accent" : "text-foreground/60"}`} />
              </button>
              <button onClick={() => {}} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary" aria-label="Share">
                <Share2 className="w-5 h-5 text-foreground/60" />
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { icon: BedDouble, label: listing.bedrooms },
              { icon: Bath, label: listing.bathrooms + " bath" },
              { icon: Calendar, label: `${listing.startDate?.slice(5)} → ${listing.endDate?.slice(5)}` },
              { icon: Check, label: listing.furnishedBool ? "Furnished" : "Unfurnished" },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-3 flex flex-col items-center text-center">
                <s.icon className="w-5 h-5 text-primary mb-1.5" />
                <span className="text-xs font-medium">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <section className="mt-8">
            <h2 className="text-lg font-bold mb-2">About this place</h2>
            <p className="text-foreground/70 leading-relaxed">{listing.description}</p>
            {listing.notes && <p className="mt-3 text-sm text-foreground/50 italic">{listing.notes}</p>}
          </section>

          {/* Amenities */}
          {listing.amenities?.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold mb-3">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {listing.amenities.map((a) => {
                  const Icon = amenityIcon[a] || Check;
                  return (
                    <div key={a} className="flex items-center gap-2 text-sm">
                      <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></span>
                      {a}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Roommates */}
          <section className="mt-8">
            <h2 className="text-lg font-bold mb-3">Living arrangement</h2>
            <div className="bg-white rounded-2xl border border-border p-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-foreground/50">Listing type</span><span className="font-medium">{listing.listingType}</span></div>
              <div className="flex justify-between"><span className="text-foreground/50">Roommates during sublease</span><span className="font-medium">{listing.roommatesRemaining}</span></div>
              <div className="flex justify-between"><span className="text-foreground/50">Pet-friendly</span><span className="font-medium">{listing.petFriendly ? "Yes" : "No"}</span></div>
              <div className="flex justify-between"><span className="text-foreground/50">Smoking</span><span className="font-medium">{listing.smoking ? "Allowed" : "Not allowed"}</span></div>
              {listing.livingNotes && <div className="pt-3 border-t border-border"><p className="text-foreground/50 text-xs mb-1">Notes</p><p className="text-foreground/80">{listing.livingNotes}</p></div>}
            </div>
          </section>

          {/* Lister */}
          <section className="mt-8">
            <h2 className="text-lg font-bold mb-3">Listed by</h2>
            <div className="flex items-center gap-3 bg-white rounded-2xl border border-border p-4">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">{listing.listerName?.[0]?.toUpperCase()}</div>
              <div>
                <p className="font-semibold">{listing.listerName}</p>
                <p className="text-xs text-foreground/50">{listing.listerUniversity || listing.universityNearby}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Sticky contact card */}
        <aside className="lg:sticky lg:top-20 h-fit">
          <div className="bg-white rounded-2xl border border-border shadow-lg p-5">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-primary">${listing.monthlyRent}</span>
              <span className="text-foreground/50 text-sm">/month</span>
            </div>
            {listing.securityDeposit ? <p className="text-sm text-foreground/60 mt-1">Security deposit: ${listing.securityDeposit}</p> : null}
            <p className="text-sm text-foreground/60 mt-1">{listing.utilitiesIncluded ? "Utilities included" : "Utilities not included"}{listing.utilityCost ? ` (~$${listing.utilityCost}/mo)` : ""}</p>
            {listing.negotiable && <p className="text-xs text-primary font-medium mt-1">Rent is negotiable</p>}

            <div className="mt-4 space-y-2">
              <Button onClick={() => setContactOpen(true)} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
                <MessageSquare className="w-4 h-4 mr-1.5" /> Contact Lister
              </Button>
              <Button variant="outline" onClick={() => toggleFavorite(listing.id)} className="w-full h-11 border-primary/30 text-primary">
                <Heart className={`w-4 h-4 mr-1.5 ${fav ? "fill-accent text-accent" : ""}`} /> {fav ? "Saved" : "Save Listing"}
              </Button>
            </div>
            <p className="mt-3 text-xs text-foreground/40 text-center">Preferred contact: {listing.contactMethod}</p>
          </div>
        </aside>
      </div>

      {/* Contact modal */}
      {contactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setContactOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Message {listing.listerName?.split(" ")[0]}</h3>
              <button onClick={() => setContactOpen(false)} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            {sent ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3"><Send className="w-7 h-7 text-primary" /></div>
                <p className="font-semibold">Message sent!</p>
                <p className="text-sm text-foreground/60 mt-1">{listing.listerName} will get back to you soon.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-foreground/60 mb-3">Say hi and ask about the place. Be friendly and specific about your timeline.</p>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder={`Hi ${listing.listerName?.split(" ")[0]}, I'm interested in your sublease at ${listing.complexName}…`} />
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setContactOpen(false)} className="flex-1">Cancel</Button>
                  <Button onClick={sendMessage} disabled={!message.trim()} className="flex-1 bg-primary text-white">Send message</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}