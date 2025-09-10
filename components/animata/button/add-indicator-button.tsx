import { useEffect, useMemo, useState } from "react";
import { CirclePlus } from "lucide-react";
import { loadFull } from "tsparticles";

import type { ISourceOptions } from "@tsparticles/engine";
import Particles, { initParticlesEngine } from "@tsparticles/react";

const options: ISourceOptions = {
  key: "circle",
  name: "Circle",
  particles: {
    number: {
      value: 20,
      density: {
        enable: false,
      },
    },
    color: {
      // value: [
      //   "#7c3aed",
      //   "#bae6fd",
      //   "#a78bfa",
      //   "#93c5fd",
      //   "#0284c7",
      //   "#fafafa",
      //   "#38bdf8",
      // ],
      value: ["#cf9031", "#879014"],
    },
    shape: {
      type: "circle",
      options: {
        star: {
          sides: 4,
        },
      },
    },
    opacity: {
      value: 0.8,
    },
    size: {
      value: { min: 1, max: 4 },
    },
    rotate: {
      value: {
        min: 0,
        max: 360,
      },
      enable: true,
      direction: "clockwise",
      animation: {
        enable: true,
        speed: 10,
        sync: false,
      },
    },
    links: {
      enable: false,
    },
    reduceDuplicates: true,
    move: {
      enable: true,
      center: {
        x: 120,
        y: 45,
      },
    },
  },
  interactivity: {
    events: {},
  },
  smooth: true,
  fpsLimit: 120,
  background: {
    color: "transparent",
    size: "cover",
  },
  fullScreen: {
    enable: false,
  },
  detectRetina: true,
  absorbers: [
    {
      enable: true,
      opacity: 0,
      size: {
        value: 1,
        density: 1,
        limit: {
          radius: 5,
          mass: 5,
        },
      },
      position: {
        x: 110,
        y: 45,
      },
    },
  ],
  emitters: [
    {
      autoPlay: true,
      fill: true,
      life: {
        wait: true,
      },
      rate: {
        quantity: 5,
        delay: 0.5,
      },
      position: {
        x: 110,
        y: 45,
      },
    },
  ],
};

export interface AddIndicatorButtonProps {
  text: string;
}

export default function AddIndicatorButton({ text }: AddIndicatorButtonProps) {
  const [particleState, setParticlesReady] = useState<"loaded" | "ready">();
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setParticlesReady("loaded");
    });
  }, []);

  const modifiedOptions = useMemo(() => {
    options.autoPlay = isHovering;
    return options;
  }, [isHovering]);

  return (
    <div
      className="group relative rounded-md text-white transition-transform hover:scale-110 active:scale-105"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative flex h-10 max-h-10 text-md items-center justify-center gap-2 rounded-full bg-gradient-to-r from-tertiary/90 to-secondary via-secondary/90 px-4 py-2 text-white">
        <span className="font-semibold truncate">Add {text}</span>
        <CirclePlus className="size-6 animate-sparkle hover:scale-110 flex-shrink-0" />
      </div>
      {!!particleState && (
        <Particles
          id="whatever"
          className={`pointer-events-none absolute -bottom-4 -left-4 -right-4 -top-4 z-0 opacity-0 transition-opacity ${
            particleState === "ready" ? "group-hover:opacity-100" : ""
          }`}
          particlesLoaded={async () => {
            setParticlesReady("ready");
          }}
          options={modifiedOptions}
        />
      )}
    </div>
  );
}
