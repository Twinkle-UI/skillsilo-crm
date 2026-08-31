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

        // Agar saved selection ab list me valid nahi hai (university
        // delete/inactive ho gayi), toh filter clear kar do - "All
        // Universities" pe wapas aa jao. Koi bhi default university
        // force-select NAHI karni - warna Total Leads jaisa data
        // galat tarah se filter ho jata hai jab user ne khud kuch select
        // hi nahi kiya.
        setSelectedUniversityState((prev) => {
          const stillValid = !prev || list.some((u) => u.name === prev);
          if (stillValid) return prev;
          localStorage.removeItem(STORAGE_KEY);
          return "";
        });
      })
      .catch((err) => console.error("Failed to load universities:", err))
      .finally(() => setLoading(false));
  }, []);

  const setSelectedUniversity = (name) => {
    setSelectedUniversityState(name);
    if (name) {
      localStorage.setItem(STORAGE_KEY, name);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
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