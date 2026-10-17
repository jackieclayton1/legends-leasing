import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-heading font-medium border-2 cursor-pointer transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary border-primary text-primary-foreground shadow-[0_4px_0_rgba(0,0,0,0.14)] hover:bg-foreground hover:border-foreground hover:text-background hover:translate-y-[2px] hover:shadow-[0_2px_0_rgba(0,0,0,0.14)]",
        destructive:
          "bg-destructive border-destructive text-destructive-foreground shadow-[0_4px_0_rgba(0,0,0,0.14)] hover:bg-foreground hover:border-foreground hover:text-background hover:translate-y-[2px] hover:shadow-[0_2px_0_rgba(0,0,0,0.14)]",
        outline:
          "bg-transparent border-foreground text-foreground hover:bg-foreground hover:text-background",
        secondary:
          "bg-secondary border-secondary text-secondary-foreground hover:bg-foreground hover:border-foreground hover:text-background",
        ghost: "border-transparent bg-transparent text-foreground hover:text-primary",
        link: "border-transparent bg-transparent text-primary p-0 hover:underline underline-offset-4",
      },
      size: {
        default: "px-6 py-3 text-[15px]",
        sm: "px-4 py-2 text-[13px]",
        lg: "px-8 py-4 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }