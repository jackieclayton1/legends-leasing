import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { mockListings } from "@/lib/mockData";

const HERO_IMG = "https://media.base44.com/images/public/6ad3bbe2b9a0a71abac080cf/e1e6e349d_generated_image.png";
const BAND_IMG = "https://media.base44.com/images/public/6ad3bbe2b9a0a71abac080cf/5f2ddbbd2_generated_image.png";

const steps = [
  { k: "1", title: "Make an account", text: "Takes a minute. Your Crimson email keeps this a student-only crowd." },
  { k: "2", title: "Post or browse", text: "Answer a few easy questions about your place, or scroll what's already up." },
  { k: "3", title: "Chat and chill", text: "Message people straight from the listing, sort the details, and you're set." },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-body">
      <Navbar />
      <main className="flex-1">
        {/* Masthead */}
        <div className="px-5 sm:px-10 pt-10 pb-5 text-center">
          <h1 className="font-heading font-semibold tracking-[-0.02em] leading-[0.95] anim-rise text-[clamp(42px,12.5vw,112px)]">
            Legends <span className="text-primary">Leasing</span>
          </h1>
          <p className="mt-5 text-[17px] sm:text-[19px] text-foreground/70 anim-rise" style={{ animationDelay: "0.3s" }}>
            Subleasing for UA students. The easy, low-stress kind.
          </p>
        </div>
        <div className="mx-5 sm:mx-10 h-1.5 rounded-full bg-primary origin-left anim-draw" />
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 px-5 sm:px-10 py-4 border-b border-border text-muted-foreground lab">
          <span>Student-verified</span>
          <span>Beta: UA campus only</span>
          <span>Tuscaloosa, AL</span>
        </div>

        {/* Hero */}
        <section className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-10 lg:gap-14 px-5 sm:px-10 pt-12 pb-16 items-center">
          <div>
            <span className="lab inline-block px-4 py-2 rounded-full bg-secondary text-primary">
              Legends Leasing: Now at The University of Alabama
            </span>
            <h2 className="font-heading font-semibold leading-[1.06] mt-5 mb-4 anim-rise text-[36px] sm:text-[46px] lg:text-[54px]" style={{ animationDelay: "0.5s" }}>
              Moving shouldn't feel like a group project.
            </h2>
            <p className="text-[17px] sm:text-[18px] leading-[1.6] text-foreground/75 anim-rise max-w-xl" style={{ animationDelay: "0.7s" }}>
              Find a place near campus, or pass yours on to someone who'll actually water the plants. Browse Tuscaloosa subleases or post yours in about five minutes.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Button size="lg" onClick={() => navigate("/register")}>Find a place →</Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/register")}>List my place</Button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-7 text-muted-foreground lab">
              <span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-primary" />Student-verified</span>
              <span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-primary" />No bots, no stress</span>
            </div>
          </div>

          <div className="anim-rise-slow" style={{ animationDelay: "0.4s" }}>
            <div className="aspect-[4/3] rounded-[28px] overflow-hidden border border-border bg-secondary">
              <Image src={HERO_IMG} fittingType="fill" alt="Bright student apartment living room" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex-1 px-5 py-4 rounded-3xl bg-card border border-border">
                <b className="block font-heading text-[26px] font-semibold text-primary">12k+</b>
                <small className="text-[13px] text-foreground/60">students finding &amp; listing</small>
              </div>
              <div className="flex-1 px-5 py-4 rounded-3xl bg-card border border-border">
                <b className="block font-heading text-[26px] font-semibold text-primary">4.9 ★</b>
                <small className="text-[13px] text-foreground/60">students dig it</small>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="px-5 sm:px-10 pb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="font-heading font-semibold leading-tight text-[32px] sm:text-[42px]">
              Three steps. That's it.
            </h3>
            <p className="mt-3 text-foreground/65 text-[16px] sm:text-[18px]">
              No lease jargon to decode, no landlord runaround, no stress.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {steps.map((s) => (
              <div key={s.k} className="rounded-[28px] bg-card border border-border p-6 transition-transform duration-200 hover:-translate-y-1">
                <span className="inline-flex w-12 h-12 rounded-2xl bg-primary text-primary-foreground items-center justify-center font-heading text-[22px] font-semibold -rotate-3">
                  {s.k}
                </span>
                <h4 className="font-heading text-[23px] font-semibold mt-4 mb-2">{s.title}</h4>
                <p className="text-[15px] leading-[1.6] text-foreground/70">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="h-[240px] sm:h-[320px] rounded-[28px] overflow-hidden border border-border mt-8">
            <Image src={BAND_IMG} fittingType="fill" alt="Students hanging out" className="w-full h-full object-cover" />
          </div>
        </section>

        {/* Listings */}
        <section className="px-5 sm:px-10 pb-16">
          <div className="flex flex-wrap items-end justify-between gap-5 mb-7">
            <div>
              <h3 className="font-heading font-semibold leading-tight text-[32px] sm:text-[42px]">
                Fresh finds near campus
              </h3>
              <p className="mt-2 text-foreground/65 text-[16px] sm:text-[17px]">
                A peek at what students just posted in Tuscaloosa.
              </p>
            </div>
            <Link
              to="/browse"
              className="focus-ring rounded-full border-2 border-foreground px-5 py-2.5 text-[15px] font-bold transition-colors duration-200 hover:bg-foreground hover:text-background"
            >
              See all listings
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {mockListings.slice(0, 4).map((l) => (
              <Link
                key={l.id}
                to={`/listings/${l.id}`}
                className="focus-ring group rounded-[28px] bg-card border border-border overflow-hidden transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <Image
                    src={l.photos[0]}
                    fittingType="fill"
                    alt={l.complexName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-5">
                  <h5 className="font-heading text-[22px] font-semibold leading-snug">{l.complexName}</h5>
                  <p className="text-[14px] text-foreground/60 mt-1">{l.city}, {l.state}</p>
                  <p className="text-[14px] text-foreground/60">{l.universityNearby}</p>
                  <div className="mt-4 font-heading text-[26px] font-semibold text-primary">
                    ${l.monthlyRent}<small className="text-[13px] font-body font-normal text-foreground/50">/mo</small>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA band */}
        <section className="px-5 sm:px-10">
          <div className="rounded-[32px] bg-primary text-primary-foreground py-12 px-6 sm:px-12 grid lg:grid-cols-[1fr_300px] gap-9 items-center">
            <div>
              <h3 className="font-heading font-semibold leading-[1.08] text-[32px] sm:text-[46px]">
                Your next place is waiting.
              </h3>
              <p className="mt-4 text-[17px] leading-[1.6] opacity-90 max-w-lg">
                Join students subleasing in Tuscaloosa. It's free, it takes a few minutes, and it definitely beats the Facebook groups.
              </p>
            </div>
            <div>
              <Button
                size="lg"
                onClick={() => navigate("/register")}
                className="w-full mb-3 bg-background text-primary border-background hover:bg-foreground hover:border-foreground hover:text-background"
              >
                Get started for free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/browse")}
                className="w-full border-primary-foreground text-primary-foreground hover:bg-foreground hover:border-foreground hover:text-background"
              >
                Browse listings
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}