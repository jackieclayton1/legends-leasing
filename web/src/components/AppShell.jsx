import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, LayoutDashboard, Home, LogOut, Heart, PlusCircle } from "lucide-react";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/AppContext";

export default function AppShell() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setOpen(false); setMenuOpen(false); }, [location.pathname]);

  const navLinks = [
    { label: "Browse", to: "/browse", icon: Home },
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  ];

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-heading text-sm font-medium transition-colors ${location.pathname === l.to ? "bg-secondary text-primary" : "text-foreground/70 hover:text-primary hover:bg-secondary/50"}`}>
                  <l.icon className="w-4 h-4" /> {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/list")} className="hidden sm:flex border-primary/30 text-primary">
              <PlusCircle className="w-4 h-4 mr-1" /> List a place
            </Button>
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-secondary transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-heading text-sm font-medium">
                  {user?.name?.[0]?.toUpperCase() || "S"}
                </div>
                <span className="hidden sm:block font-heading text-sm font-medium max-w-[120px] truncate">{user?.name || "Student"}</span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-border py-2 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-semibold truncate">{user?.name}</p>
                      <p className="text-xs text-foreground/50 truncate">{user?.email}</p>
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"><LayoutDashboard className="w-4 h-4" /> My Listings</Link>
                    <Link to="/browse" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"><Heart className="w-4 h-4" /> Browse</Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/5"><LogOut className="w-4 h-4" /> Sign out</button>
                  </div>
                </>
              )}
            </div>
            <button className="md:hidden p-2 rounded-lg hover:bg-secondary" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
        {open && (
          <div className="md:hidden border-t border-border px-4 py-3 space-y-1">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="flex items-center gap-2 px-4 py-2.5 rounded-full font-heading text-sm font-medium hover:bg-secondary">
                <l.icon className="w-4 h-4" /> {l.label}
              </Link>
            ))}
            <Link to="/list" className="flex items-center gap-2 px-4 py-2.5 rounded-full font-heading text-sm font-medium text-primary hover:bg-secondary">
              <PlusCircle className="w-4 h-4" /> List a place
            </Link>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}