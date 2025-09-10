"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export const AnimatedBlob = () => {
  const [position, setPosition] = useState({ x: 50, y: 30 });
  const [size, setSize] = useState(100);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  const { theme } = useTheme();

  // Use a ref to store the target positions for smoother animation sequences
  const animationQueue = useRef<Array<{x: number, y: number, size: number}>>([]);

  useEffect(() => {
    // Generate several random positions to create a movement path
    const generateAnimationPath = () => {
      // Clear existing queue
      animationQueue.current = [];


      // Generate 3-5 waypoints across the page
      const waypoints = Math.floor(Math.random() * 3) + 3;

      for (let i = 0; i < waypoints; i++) {
        // Generate a position anywhere on the page with wider bounds
        // This ensures more movement across the entire page
        const newX = Math.random() * 80 + 10; // 10-90% of width
        const newY = Math.random() * 70 + 10; // 10-80% of height
        const newSize = Math.random() * 70 + 170; // 170-240px

        animationQueue.current.push({
          x: newX,
          y: newY,
          size: newSize
        });
      }
    };

    const moveToNextPosition = () => {
      // If queue is empty, generate new path
      if (animationQueue.current.length === 0) {
        generateAnimationPath();
      }

      // Get next position from queue
      const nextPosition = animationQueue.current.shift();

      if (nextPosition) {
        setPosition({ x: nextPosition.x, y: nextPosition.y });
        setSize(nextPosition.size);
      }

      // Schedule next movement
      timeoutRef.current = setTimeout(moveToNextPosition, 8000);
    };

    // Initialize on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      generateAnimationPath();
      // Start with a short delay
      timeoutRef.current = setTimeout(moveToNextPosition, 1000);
      return;
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Add a slow pulsing animation for additional visual interest
  const [pulseSize, setPulseSize] = useState(0);

  useEffect(() => {
    const pulsateInterval = setInterval(() => {
      setPulseSize(prev => (prev + 1) % 20); // 0-19 range
    }, 300);

    return () => clearInterval(pulsateInterval);
  }, []);

  const pulseOffset = Math.sin(pulseSize * 0.3) * 10; // Gentle sine wave

  // Choose the appropriate gradient based on theme
  const getGradient = () => {
    if (theme === "dark") {
      // Extra vibrant gradient for dark mode with higher saturation
      return 'radial-gradient(circle, rgba(255,204,0,0.95) 10%, rgba(255,174,0,0.85) 30%, rgba(255,145,0,0.7) 50%, rgba(234,179,8,0.4) 70%, rgba(234,179,8,0) 100%)';
    }
    return 'radial-gradient(circle, rgba(255,204,0,0.9) 30%, rgba(234,179,8,0.7) 50%, rgba(207,144,49,0.4) 70%, rgba(207,144,49,0) 90%)';
  };

  // Make the blob bigger for more presence
  const sizeMultiplier = theme === "dark" ? 1.3 : 1;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ zIndex: 1 }}
    >
      <div
        className="absolute rounded-full"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          width: `${(size + pulseOffset) * sizeMultiplier}px`,
          height: `${(size + pulseOffset) * sizeMultiplier}px`,
          transform: 'translate(-50%, -50%)',
          background: getGradient(),
          boxShadow: theme === "dark"
            ? '0 0 120px 60px rgba(255,204,0,0.5)'  // Extreme glow for dark mode
            : '0 0 80px 30px rgba(234,179,8,0.25)',
          filter: theme === "dark" ? 'blur(20px)' : 'blur(30px)',
          opacity: theme === "dark" ? 1 : 0.9,
          transition: 'left 8s ease-in-out, top 8s ease-in-out, width 5s ease-in-out, height 5s ease-in-out',
        }}
      />
    </div>
  );
};
