"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  "aria-label": string;
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  ...props
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      value={value}
      min={min}
      max={max}
      step={step}
      onValueChange={onValueChange}
      {...props}
    >
      <SliderPrimitive.Control className='flex h-5 w-full touch-none items-center'>
        <SliderPrimitive.Track className='relative h-1.5 w-full rounded-full bg-muted'>
          <SliderPrimitive.Indicator className='rounded-full bg-primary' />
          <SliderPrimitive.Thumb className='size-4 rounded-full border bg-background shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50' />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}
