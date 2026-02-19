"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  onValueChange?: (value: number) => void;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, onValueChange, onChange, ...props }, ref) => {
    return (
      <input
        type="range"
        ref={ref}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary",
          className
        )}
        onChange={(e) => {
          onChange?.(e);
          onValueChange?.(Number(e.target.value));
        }}
        {...props}
      />
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
