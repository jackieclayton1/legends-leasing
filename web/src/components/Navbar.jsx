import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const links = [
    { label: "Browse", to: "/browse" },
    { label: "How it works", to: "/#how-it-works" },
  ];

  const linkClass = "focus-ring rounded-full px-4 py-2 text-[15px] font-heading font-medium text-foreground transition-colors duration-200 hover:bg-secondary hover:text-primary";

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border">
      <nav className="flex items-center justify-between px-5 sm:px-10 py-4">
        <Logo />
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.label} to={l.to} className={linkClass}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => navigate("/login")} className={linkClass}>
            Sign in
          </button>
          <button
            onClick={() => navigate("/register")}
            className="focus-ring rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-[15px] font-heading font-medium transition-all duration-200 hover:bg-foreground hover:text-background active:scale-[0.97]"
          >
            Get started
          </button>
        </div>
        <button className="md:hidden p-2 rounded-full focus-ring hover:bg-secondary" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>
      {open && (
        <div className="md:hidden border-t border-border px-5 py-4 space-y-1">
          {links.map((l) => (
            <Link key={l.label} to={l.to} className="block rounded-2xl px-4 py-3 text-[16px] font-heading font-medium text-foreground hover:bg-secondary hover:text-primary">
              {l.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-border">
            <button onClick={() => navigate("/login")} className="text-left rounded-2xl px-4 py-3 text-[16px] font-heading font-medium text-foreground hover:bg-secondary hover:text-primary">
              Sign in
            </button>
            <button
              onClick={() => navigate("/register")}
              className="rounded-full bg-primary text-primary-foreground px-5 py-3 text-[16px] font-heading font-medium text-center transition-colors duration-200 hover:bg-foreground hover:text-background"
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}