import { Link } from "react-router-dom";
import Logo from "./Logo";

const dot = <span className="inline-block w-2 h-2 rounded-full bg-primary" />;

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="grid md:grid-cols-[2fr_1fr_1fr] gap-8 px-5 sm:px-10 pt-10">
        <div>
          <Logo size="lg" />
          <p className="mt-3 text-[14px] leading-[1.55] text-foreground/80 max-w-[280px]">
            The subleasing marketplace, now in beta at The University of Alabama. Find a place in Tuscaloosa or list yours. More campuses are coming soon.
          </p>
        </div>
        <div>
          <h6 className="text-primary mb-3 lab">Platform</h6>
          <ul className="text-[14px] text-foreground/80 flex flex-col gap-[9px]">
            <li><Link to="/browse" className="transition-colors hover:text-primary">Browse Listings</Link></li>
            <li><Link to="/#how-it-works" className="transition-colors hover:text-primary">How It Works</Link></li>
            <li><Link to="/register" className="transition-colors hover:text-primary">Get Started</Link></li>
          </ul>
        </div>
        <div>
          <h6 className="text-primary mb-3 lab">Trust &amp; Safety</h6>
          <ul className="text-[14px] text-foreground/80 flex flex-col gap-[9px]">
            <li className="flex items-center gap-2">{dot}Student-verified</li>
            <li className="flex items-center gap-2">{dot}Crimson email required</li>
            <li className="flex items-center gap-2">{dot}Beta: more campuses coming soon</li>
          </ul>
        </div>
      </div>
      <div className="mt-10 border-t border-border py-5 px-5 sm:px-10 text-center text-muted-foreground lab">
        © {new Date().getFullYear()} Legends Leasing. A student subleasing marketplace.
      </div>
    </footer>
  );
}