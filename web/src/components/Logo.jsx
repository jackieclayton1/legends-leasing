import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function Logo({ size = "sm", compact = false }) {
  if (size === "lg") {
    return (
      <Link to="/" className="flex items-center gap-3 group">
        <span className="w-[40px] h-[40px] rounded-2xl bg-primary flex items-center justify-center shrink-0 -rotate-3 transition-transform duration-200 group-hover:rotate-0">
          <Home className="w-5 h-5 text-primary-foreground" strokeWidth={2.4} />
        </span>
        {!compact && (
          <span className="font-heading text-[30px] sm:text-[44px] font-semibold tracking-[-0.02em] leading-none text-foreground">
            Legends <span className="text-primary">Leasing</span>
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <span className="w-[30px] h-[30px] rounded-xl bg-primary flex items-center justify-center shrink-0 -rotate-3 transition-transform duration-200 group-hover:rotate-0">
        <Home className="w-4 h-4 text-primary-foreground" strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className="font-heading text-[20px] font-semibold tracking-[-0.01em] leading-none text-foreground">
          Legends <span className="text-primary">Leasing</span>
        </span>
      )}
    </Link>
  );
}