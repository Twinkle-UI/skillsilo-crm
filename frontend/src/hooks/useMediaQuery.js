import { useState, useEffect } from 'react';

// Custom hook - kisi bhi media query ko track kar sakta hai
// Example: const isMobile = useMediaQuery('(max-width: 768px)');
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);

    // Modern browsers
    mediaQuery.addEventListener('change', handler);

    // Initial sync (in case it changed before mount)
    setMatches(mediaQuery.matches);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
