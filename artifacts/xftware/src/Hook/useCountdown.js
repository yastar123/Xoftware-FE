import { useState, useRef } from "react";

export default function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  const startCountdown = (duration = 60) => {
    clearInterval(timerRef.current);
    setSeconds(duration);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return { seconds, startCountdown };
}
