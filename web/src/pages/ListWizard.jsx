import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Upload, X, Star, GripVertical, CheckCircle2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/FormField";
import { useApp } from "@/lib/AppContext";
import { amenitiesList, apartmentTypes, contactMethods, defaultListingPhoto } from "@/lib/mockData";
import { SCHOOL, isSchoolEmail } from "@/lib/school";

const STEPS = [
  "About You",
  "Apartment Details",
  "Availability & Pricing",
  "Roommates & Living",
  "Amenities",
  "Photos & Description",
  "Review",
];

const emptyForm = {
  // step 1
  fullName: "", university: SCHOOL.name, studentEmail: "", contactMethod: "Email",
  // step 2
  complexName: "", streetAddress: "", city: SCHOOL.city, state: SCHOOL.state, universityNearby: SCHOOL.name,
  apartmentType: "1-bedroom", rentType: "entire", bathroomType: "private",
  furnished: "Furnished", squareFootage: "",
  // step 3
  startDate: "", endDate: "", monthlyRent: "", securityDeposit: "",
  utilitiesIncluded: false, utilityCost: "", negotiable: false, landlordApproved: "Pending",
  // step 4
  roommatesCurrent: "0", roommatesRemaining: "0", pets: false, petFriendly: false,
  smoking: false, livingNotes: "",
  // step 5
  amenities: [],
  // step 6
  photos: [], coverIndex: 0, description: "", notes: "",
};

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${active ? "bg-primary text-white border-primary" : "bg-white text-foreground/70 border-border hover:border-primary/50 hover:text-primary"}`}>
      {active && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}{children}
    </button>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full p-4 rounded-xl border border-border bg-white hover:border-primary/40 transition-colors text-left">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {description && <p className="text-xs text-foreground/50 mt-0.5">{description}</p>}
      </div>
      <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

function RadioCard({ active, onClick, label }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${active ? "bg-primary text-white border-primary" : "bg-white text-foreground/70 border-border hover:border-primary/50"}`}>
      {label}
    </button>
  );
}

export default function ListWizard() {
  const navigate = useNavigate();
  const { user, draft, saveDraft, clearDraft, addListing } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => draft || { ...emptyForm, fullName: user?.name || "", studentEmail: user?.email || "" });
  const [errors, setErrors] = useState({});
  const [published, setPublished] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { saveDraft(form); }, [form, saveDraft]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.fullName) e.fullName = "Enter your full name.";
      if (!form.studentEmail) e.studentEmail = "Enter your student email.";
      else if (!isSchoolEmail(form.studentEmail)) e.studentEmail = `Use your ${SCHOOL.name} email.`;
    }
    if (s === 1) {
      if (!form.complexName) e.complexName = "Enter the apartment complex or building name.";
    }
    if (s === 2) {
      if (!form.startDate) e.startDate = "Select a start date.";
      if (!form.endDate) e.endDate = "Select an end date.";
      if (!form.monthlyRent) e.monthlyRent = "Enter the monthly rent.";
      else if (Number(form.monthlyRent) <= 0) e.monthlyRent = "Rent must be greater than 0.";
    }
    if (s === 5) {
      if (!form.description || form.description.length < 20) e.description = "Write at least a short description (20+ characters).";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) { setStep((s) => Math.min(s + 1, STEPS.length - 1)); setErrors({}); window.scrollTo({ top: 0, behavior: "smooth" }); } };
  const back = () => { setStep((s) => Math.max(s - 1, 0)); setErrors({}); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleFiles = (files) => {
    const urls = Array.from(files).map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    set("photos", [...form.photos, ...urls]);
  };

  const removePhoto = (i) => {
    const photos = form.photos.filter((_, idx) => idx !== i);
    set("photos", photos);
    if (form.coverIndex >= photos.length) set("coverIndex", 0);
  };
  const movePhoto = (i, dir) => {
    const photos = [...form.photos];
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    [photos[i], photos[j]] = [photos[j], photos[i]];
    set("photos", photos);
    if (form.coverIndex === i) set("coverIndex", j);
    else if (form.coverIndex === j) set("coverIndex", i);
  };

  const publish = () => {
    const bedroomsCount = { "Studio": 0, "1-bedroom": 1, "2-bedroom": 2, "3-bedroom": 3, "4+ bedrooms": 4 }[form.apartmentType] ?? 1;
    const listing = {
      ...form,
      city: SCHOOL.city,
      state: SCHOOL.state,
      universityNearby: SCHOOL.fullName,
      university: SCHOOL.fullName,
      bedrooms: form.apartmentType,
      bedroomsCount,
      bathrooms: form.bathroomType === "private" ? "Private" : "Shared",
      furnishedBool: form.furnished === "Furnished",
      listingType: form.rentType === "entire" ? "Entire unit" : "Individual bedroom",
      status: "Published",
      photos: form.photos.length ? form.photos.map((p) => p.url) : [defaultListingPhoto],
    };
    addListing(listing);
    clearDraft();
    setPublished(true);
    window.scrollTo({ top: 0 });
  };

  if (published) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-11 h-11 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Listing published! 🎉</h1>
        <p className="mt-3 text-foreground/60">Your apartment is now live and visible to students searching for a place.</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate("/dashboard")} className="bg-primary hover:bg-primary/90 text-white h-12 px-8">Go to My Listings</Button>
          <Button variant="outline" onClick={() => navigate("/browse")} className="h-12 px-8 border-primary/30 text-primary">View on Browse</Button>
        </div>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Header + progress */}
      <div className="mb-8">
        <button onClick={() => navigate("/choose")} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">List your apartment</h1>
        <p className="mt-1 text-foreground/60 text-sm">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => (
            <span key={s} className={`text-[11px] px-2 py-0.5 rounded-full ${i === step ? "bg-primary text-white" : i < step ? "bg-secondary text-primary" : "bg-muted text-foreground/40"}`}>
              {i < step ? "✓ " : ""}{s}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border shadow-sm p-6 sm:p-8">
        {/* STEP 0: About You */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">About you</h2>
            <FormField label="Full name" required error={errors.fullName}>
              <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Your full name" />
            </FormField>
            <FormField label="University" required>
              <div className="h-9 flex items-center px-3 rounded-md border border-input bg-muted text-sm text-foreground/70">
                {SCHOOL.fullName}
              </div>
            </FormField>
            <FormField label="Student email" required error={errors.studentEmail} hint={`${SCHOOL.fullName} email, prefilled from your account.`}>
              <Input type="email" value={form.studentEmail} onChange={(e) => set("studentEmail", e.target.value)} placeholder={`you@${SCHOOL.emailDomains[0]}`} />
            </FormField>
            <FormField label="Preferred contact method" required>
              <div className="flex flex-wrap gap-2">
                {contactMethods.map((m) => (
                  <RadioCard key={m} active={form.contactMethod === m} onClick={() => set("contactMethod", m)} label={m} />
                ))}
              </div>
            </FormField>
          </div>
        )}

        {/* STEP 1: Apartment Details */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Apartment details</h2>
            <FormField label="Apartment complex or building name" required error={errors.complexName}>
              <Input value={form.complexName} onChange={(e) => set("complexName", e.target.value)} placeholder="e.g. Riverfront Village" />
            </FormField>
            <FormField label="Street address" optional>
              <Input value={form.streetAddress} onChange={(e) => set("streetAddress", e.target.value)} placeholder="2330 Jack Warner Pkwy" />
            </FormField>
            <FormField label="Location" required hint="Legends Leasing lists Tuscaloosa apartments near UA only.">
              <div className="h-9 flex items-center px-3 rounded-md border border-input bg-muted text-sm text-foreground/70">
                {SCHOOL.city}, {SCHOOL.state} ({SCHOOL.fullName})
              </div>
            </FormField>
            <FormField label="Apartment type" required>
              <div className="flex flex-wrap gap-2">
                {apartmentTypes.map((t) => (
                  <RadioCard key={t} active={form.apartmentType === t} onClick={() => set("apartmentType", t)} label={t} />
                ))}
              </div>
            </FormField>
            <FormField label="Listing is for" required>
              <div className="flex flex-wrap gap-2">
                <RadioCard active={form.rentType === "entire"} onClick={() => set("rentType", "entire")} label="Entire unit" />
                <RadioCard active={form.rentType === "bedroom"} onClick={() => set("rentType", "bedroom")} label="Individual bedroom" />
              </div>
            </FormField>
            <FormField label="Bathroom" required>
              <div className="flex flex-wrap gap-2">
                <RadioCard active={form.bathroomType === "private"} onClick={() => set("bathroomType", "private")} label="Private bathroom" />
                <RadioCard active={form.bathroomType === "shared"} onClick={() => set("bathroomType", "shared")} label="Shared bathroom" />
              </div>
            </FormField>
            <FormField label="Furnishing" required>
              <div className="flex flex-wrap gap-2">
                <RadioCard active={form.furnished === "Furnished"} onClick={() => set("furnished", "Furnished")} label="Furnished" />
                <RadioCard active={form.furnished === "Unfurnished"} onClick={() => set("furnished", "Unfurnished")} label="Unfurnished" />
              </div>
            </FormField>
            <FormField label="Floor plan / square footage" optional>
              <Input value={form.squareFootage} onChange={(e) => set("squareFootage", e.target.value)} placeholder="e.g. 850 sqft, 2 bed / 1 bath" />
            </FormField>
          </div>
        )}

        {/* STEP 2: Availability & Pricing */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Availability & pricing</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Sublease start date" required error={errors.startDate}>
                <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </FormField>
              <FormField label="Sublease end date" required error={errors.endDate}>
                <Input type="date" value={form.endDate} min={form.startDate} onChange={(e) => set("endDate", e.target.value)} />
              </FormField>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Monthly rent (USD)" required error={errors.monthlyRent}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">$</span>
                  <Input type="number" min="0" value={form.monthlyRent} onChange={(e) => set("monthlyRent", e.target.value)} placeholder="1450" className="pl-7" />
                </div>
              </FormField>
              <FormField label="Security deposit" optional>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">$</span>
                  <Input type="number" min="0" value={form.securityDeposit} onChange={(e) => set("securityDeposit", e.target.value)} placeholder="800" className="pl-7" />
                </div>
              </FormField>
            </div>
            <Toggle checked={form.utilitiesIncluded} onChange={(v) => set("utilitiesIncluded", v)} label="Utilities included in rent" description="Water, electric, internet, etc. are covered." />
            {form.utilitiesIncluded && (
              <FormField label="Estimated monthly utility cost" optional>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">$</span>
                  <Input type="number" min="0" value={form.utilityCost} onChange={(e) => set("utilityCost", e.target.value)} placeholder="60" className="pl-7" />
                </div>
              </FormField>
            )}
            <Toggle checked={form.negotiable} onChange={(v) => set("negotiable", v)} label="Rent is negotiable" />
            <FormField label="Is the sublease approved by the landlord?" required>
              <div className="flex flex-wrap gap-2">
                {["Yes", "No", "Pending"].map((o) => (
                  <RadioCard key={o} active={form.landlordApproved === o} onClick={() => set("landlordApproved", o)} label={o} />
                ))}
              </div>
            </FormField>
          </div>
        )}

        {/* STEP 3: Roommates & Living */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Roommates & living preferences</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Roommates currently living there" required>
                <Input type="number" min="0" value={form.roommatesCurrent} onChange={(e) => set("roommatesCurrent", e.target.value)} placeholder="2" />
              </FormField>
              <FormField label="Roommates remaining during sublease" required>
                <Input type="number" min="0" value={form.roommatesRemaining} onChange={(e) => set("roommatesRemaining", e.target.value)} placeholder="0" />
              </FormField>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Toggle checked={form.pets} onChange={(v) => set("pets", v)} label="There are pets" description="Any pets currently in the apartment." />
              <Toggle checked={form.petFriendly} onChange={(v) => set("petFriendly", v)} label="Pet-friendly" description="Building allows pets." />
              <Toggle checked={form.smoking} onChange={(v) => set("smoking", v)} label="Smoking allowed" />
            </div>
            <FormField label="Anything tenants should know?" optional hint="Keep it respectful and focused on living conditions.">
              <Textarea value={form.livingNotes} onChange={(e) => set("livingNotes", e.target.value)} placeholder="e.g. Quiet building, great for summer research students." rows={4} />
            </FormField>
          </div>
        )}

        {/* STEP 4: Amenities */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Amenities</h2>
            <p className="text-sm text-foreground/60">Select everything that applies to your apartment.</p>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map((a) => {
                const active = form.amenities.includes(a);
                return (
                  <Chip key={a} active={active} onClick={() => set("amenities", active ? form.amenities.filter((x) => x !== a) : [...form.amenities, a])}>
                    {a}
                  </Chip>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Photos & Description */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Photos & description</h2>
            <FormField label="Apartment photos" hint="Upload multiple photos, reorder them, and pick a cover image.">
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors"
              >
                <ImagePlus className="w-8 h-8 mx-auto text-foreground/40 mb-2" />
                <p className="text-sm font-medium">Click to upload or drag photos here</p>
                <p className="text-xs text-foreground/40 mt-1">JPG or PNG. Multiple files welcome.</p>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              </div>
            </FormField>

            {form.photos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Reorder & set cover</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.photos.map((p, i) => (
                    <div key={i} className={`relative group rounded-xl overflow-hidden border-2 ${form.coverIndex === i ? "border-primary" : "border-border"}`}>
                      <img src={p.url} alt={p.name} className="w-full aspect-square object-cover" />
                      <div className="absolute top-1.5 left-1.5 flex gap-1">
                        {form.coverIndex === i && <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-white" />Cover</span>}
                      </div>
                      <div className="absolute top-1.5 right-1.5 flex gap-1">
                        <button onClick={() => movePhoto(i, -1)} disabled={i === 0} className="w-6 h-6 rounded-md bg-white/90 flex items-center justify-center disabled:opacity-30" aria-label="Move left"><ArrowLeft className="w-3 h-3" /></button>
                        <button onClick={() => movePhoto(i, 1)} disabled={i === form.photos.length - 1} className="w-6 h-6 rounded-md bg-white/90 flex items-center justify-center disabled:opacity-30" aria-label="Move right"><ArrowRight className="w-3 h-3" /></button>
                        <button onClick={() => removePhoto(i)} className="w-6 h-6 rounded-md bg-white/90 flex items-center justify-center text-destructive" aria-label="Remove"><X className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => set("coverIndex", i)} className={`absolute bottom-0 inset-x-0 text-[11px] py-1 ${form.coverIndex === i ? "bg-primary text-white" : "bg-white/90 text-foreground/70"}`}>
                        {form.coverIndex === i ? "Cover photo" : "Set as cover"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FormField label="Listing description" required error={errors.description} hint="A short, friendly description of the space.">
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Sunny 2-bedroom just two blocks from UA campus. Fully furnished, in-unit laundry…" rows={5} />
            </FormField>
            <FormField label="Additional notes" optional>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything else worth mentioning." rows={3} />
            </FormField>
          </div>
        )}

        {/* STEP 6: Review */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Review your listing</h2>
              <p className="text-sm text-foreground/60">This is how students will see it. Edit any section before publishing.</p>
            </div>

            {/* Preview card */}
            <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
              <div className="aspect-[16/9] bg-secondary overflow-hidden">
                <img src={form.photos[form.coverIndex]?.url || form.photos[0]?.url || defaultListingPhoto} alt={form.complexName} className="w-full h-full object-cover" />
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">{form.complexName || "Your apartment"}</h3>
                    <p className="text-sm text-foreground/60">{form.city}{form.city && form.state ? ", " : ""}{form.state} · {form.universityNearby}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-primary">${form.monthlyRent || "TBD"}</p>
                    <p className="text-xs text-foreground/50">per month</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-secondary text-primary">{form.apartmentType}</span>
                  <span className="px-2.5 py-1 rounded-full bg-secondary text-primary">{form.bathroomType === "private" ? "Private bath" : "Shared bath"}</span>
                  <span className="px-2.5 py-1 rounded-full bg-secondary text-primary">{form.furnished}</span>
                  <span className="px-2.5 py-1 rounded-full bg-secondary text-primary">{form.rentType === "entire" ? "Entire unit" : "Bedroom"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-border">
                  <div><p className="text-foreground/50 text-xs">Available</p><p className="font-medium">{form.startDate || "TBD"} → {form.endDate || "TBD"}</p></div>
                  <div><p className="text-foreground/50 text-xs">Landlord approval</p><p className="font-medium">{form.landlordApproved}</p></div>
                  <div><p className="text-foreground/50 text-xs">Utilities</p><p className="font-medium">{form.utilitiesIncluded ? "Included" : "Not included"}</p></div>
                  <div><p className="text-foreground/50 text-xs">Contact</p><p className="font-medium">{form.contactMethod}</p></div>
                </div>
                {form.amenities.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-foreground/50 mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.amenities.map((a) => <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-muted">{a}</span>)}
                    </div>
                  </div>
                )}
                {form.description && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-foreground/50 mb-1">Description</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{form.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Edit shortcuts */}
            <div className="flex flex-wrap gap-2">
              {STEPS.slice(0, 6).map((s, i) => (
                <button key={s} onClick={() => setStep(i)} className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:text-primary">
                  Edit: {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button variant="ghost" onClick={back} disabled={step === 0} className="text-foreground/70">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next} className="bg-primary hover:bg-primary/90 text-white px-6">
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={publish} className="bg-primary hover:bg-primary/90 text-white px-6">
              Publish Listing <Check className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-foreground/40">Your progress saves automatically as you go.</p>
    </div>
  );
}