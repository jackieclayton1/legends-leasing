import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormField({ label, required, optional, error, children, hint }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label className="text-sm font-semibold text-foreground">
          {label}{required && <span className="text-accent ml-0.5">*</span>}
          {optional && <span className="text-xs font-normal text-foreground/40 ml-2">Optional</span>}
        </Label>
      </div>
      {children}
      {hint && !error && <p className="text-xs text-foreground/50">{hint}</p>}
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}

export function PasswordInput({ value, onChange, placeholder, id, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}