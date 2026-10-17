import { useNavigate } from "react-router-dom";
import { KeyRound, Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/AppContext";

export default function ChoosePath() {
  const navigate = useNavigate();
  const { user } = useApp();

  const cards = [
    {
      icon: KeyRound,
      title: "List My Place",
      desc: "Heading home, studying abroad, or moving out early? Find someone to take over your place.",
      cta: "List My Apartment",
      to: "/list",
      accent: "bg-secondary text-primary",
    },
    {
      icon: Search,
      title: "Find a Place",
      desc: "Looking for a place for the summer, a semester, or somewhere in between? Explore student subleases.",
      cta: "Browse Apartments",
      to: "/browse",
      accent: "bg-accent/20 text-accent-foreground",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-primary text-xs font-semibold mb-5">
          <Sparkles className="w-3.5 h-3.5" /> Hi {user?.name?.split(" ")[0] || "there"} 👋
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">What brings you here?</h1>
        <p className="mt-4 text-lg text-foreground/60">Whether you're heading out or moving in, we've got you covered.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {cards.map((c) => (
          <button
            key={c.title}
            onClick={() => navigate(c.to)}
            className="group text-left bg-white rounded-3xl p-8 border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <div className={`w-16 h-16 rounded-2xl ${c.accent} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <c.icon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">{c.title}</h2>
            <p className="mt-3 text-foreground/60 leading-relaxed">{c.desc}</p>
            <div className="mt-6 inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
              {c.cta} <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-foreground/50">
        You can switch between finding and listing a place anytime. No second account needed.
      </p>
    </div>
  );
}