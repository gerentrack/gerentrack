import { useState, useEffect } from "react";

const BREAKPOINTS = { mobile: 768, tablet: 1024 };

export function useResponsivo() {
  const [largura, setLargura] = useState(window.innerWidth);

  useEffect(() => {
    let raf;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setLargura(window.innerWidth));
    };
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("resize", handler);
      cancelAnimationFrame(raf);
    };
  }, []);

  return {
    largura,
    mobile: largura < BREAKPOINTS.mobile,
    tablet: largura >= BREAKPOINTS.mobile && largura < BREAKPOINTS.tablet,
    desktop: largura >= BREAKPOINTS.tablet,
  };
}
