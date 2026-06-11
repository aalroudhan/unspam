import { useEffect, useRef, useState } from 'react';

// Animates a number from its previous value to the target over ~600ms.
export function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    prev.current = value;
    if (start === end) return;

    const duration = 600;
    const startTime = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      setDisplay(Math.round(start + (end - start) * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}
