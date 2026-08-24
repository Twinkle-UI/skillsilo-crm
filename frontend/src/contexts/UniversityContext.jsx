import { createContext, useContext, useState, useEffect } from "react";
import { universityAPI } from "../services/api";

const UniversityContext = createContext(null);

const STORAGE_KEY = "selectedUniversity";

export function UniversityProvider({ children }) {
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversityState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    universityAPI
      .getAll()
      .then((res) => {
        const list = res?.data || [];
        setUniversities(list);

        // Agar pehle se koi selection saved nahi hai, ya saved university
        // ab list me nahi hai (delete/inactive ho gayi), toh pehli active
        // university default select kar do.
        setSelectedUniversityState((prev) => {
          const stillValid = list.some((u) => u.name === prev);
          if (prev && stillValid) return prev;
          const fallback = list[0]?.name || "";
          if (fallback) localStorage.setItem(STORAGE_KEY, fallback);
          return fallback;
        });
      })
      .catch((err) => console.error("Failed to load universities:", err))
      .finally(() => setLoading(false));
  }, []);

  const setSelectedUniversity = (name) => {
    setSelectedUniversityState(name);
    localStorage.setItem(STORAGE_KEY, name);
  };

  return (
    <UniversityContext.Provider
      value={{ universities, selectedUniversity, setSelectedUniversity, loading }}
    >
      {children}
    </UniversityContext.Provider>
  );
}

export function useUniversity() {
  const ctx = useContext(UniversityContext);
  if (!ctx) {
    throw new Error("useUniversity must be used within a UniversityProvider");
  }
  return ctx;
}