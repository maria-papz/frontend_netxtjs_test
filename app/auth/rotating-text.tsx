"use client";
import { useEffect, useState } from "react";

export default function RotatingTexts() {
  const texts = [
    "\"The Centre aims at high quality research in economics and especially economic policy-oriented research related to Cyprus and Europe. Research at CypERC also aims at results of high academic standards with wide international interest.\"",
    "\"The main objective of CypERC is to contribute to the economic debate in Cyprus by disseminating research results with policy implications obtained from in-depth analysis and state-of-the-art empirical investigation.\"",
    "\"For this purpose it publishes Economic Policy Papers, the results of which are summarized in the semi-annual Newsletter circulated to a wide audience. It also publishes on a monthly and quarterly basis or periodically various bulletins that describe and analyze the state of the Cypriot economy.\"",
    "\"CypERC also publishes the bi-annual journal Cyprus Economic Policy Review, and aims to publish high quality articles with policy conclusions of Cypriot and wider interest.\""
  ];

  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const handleNext = () => {
    setFade(false);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % texts.length);
      setFade(true);
    }, 500);
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      handleNext();
    }, 7000);

    return () => clearInterval(intervalId);
  }, [texts.length]);

  return (
    <div className="relative">
      <div className={`transition-opacity duration-700 ease-in-out ${fade ? 'opacity-100' : 'opacity-70'}`}>
        <p key={index}>{texts[index]}</p>
      </div>
    </div>
  );
}
