"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

const images = [
  "/images/ucy-library.jpg",
  "/images/KOE.jpg",
  "/images/KOEdark.jpg",
]; // Add more images as needed

const ImageSlideshow = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div className="relative w-full h-full">
        {images.map((src, index) => (
          <Image
            key={index}
            src={src}
            fill
            style={{
              objectFit: "cover",
              opacity: index === currentImageIndex ? 1 : 0,
              transition: "opacity 1s ease-in-out",
              clipPath: "inset(0 50% 0 0)",
            }}
            alt="Slideshow Image"
            className="absolute top-0 left-0 w-full h-full halfLaptop:hidden"
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlideshow;
