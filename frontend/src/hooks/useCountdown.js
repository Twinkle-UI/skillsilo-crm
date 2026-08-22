import { useState, useEffect } from 'react';

// Live countdown - har second update hota hai
// Returns: "0d 4h 3m 32s" format string
export default function useCountdown(targetDate) {
  const calculateTimeLeft = () => {
    const diff = new Date(targetDate).getTime() - Date.now();

    if (diff <= 0) {
      return { expired: true, display: 'Overdue' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
      expired: false,
      display: `${days}d ${hours}h ${minutes}m ${seconds}s`
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    // Har second update karo
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Cleanup on unmount - memory leak prevent karne ke liye zaroori hai
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}
