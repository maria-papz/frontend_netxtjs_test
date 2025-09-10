"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  text: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function InfoTooltip({ text, side = "top" }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:text-primary">
            <Info className="h-3.5 w-3.5" />
            <span className="sr-only">More information</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-sm text-xs">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
