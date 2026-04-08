import { useState, useEffect, useRef } from "react";

// Detects steps using DeviceMotion API (mobile only)
export function useStepCounter(active) {
  const [steps, setSteps] = useState(0);
  const [supported, setSupported] = useState(false);
  const lastPeakRef = useRef(0);
  const magnitudesRef = useRef([]);

  useEffect(() => {
    // Only works on mobile with DeviceMotion support
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (!isMobile || !window.DeviceMotionEvent) return;
    setSupported(true);
  }, []);

  useEffect(() => {
    if (!active || !supported) return;

    setSteps(0);
    magnitudesRef.current = [];
    lastPeakRef.current = 0;

    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
      const buf = magnitudesRef.current;
      buf.push(magnitude);
      if (buf.length > 10) buf.shift();

      const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
      const now = Date.now();

      // Step detected: peak above threshold, with min 300ms between steps
      if (magnitude > avg + 2.5 && now - lastPeakRef.current > 300) {
        lastPeakRef.current = now;
        setSteps((s) => s + 1);
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [active, supported]);

  return { steps, supported };
}