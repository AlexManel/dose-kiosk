import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans tracking-wide transition-[color,background-color,border-color,filter,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        cream: "bg-cream text-bg hover:brightness-95",
        ghost:
          "border border-line text-cream bg-transparent hover:border-cream-dim",
        sage: "bg-sage text-cream hover:brightness-110",
        icon: "border border-cream text-cream bg-transparent hover:bg-cream hover:text-bg",
      },
      size: {
        md: "min-h-11 px-6 py-2.5 rounded-full text-sm",
        sm: "min-h-10 px-4 py-2 rounded-full text-xs",
        full: "min-h-12 px-6 py-3 rounded-full text-sm w-full",
        icon: "size-9 rounded-full text-lg leading-none",
      },
    },
    defaultVariants: { variant: "cream", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
