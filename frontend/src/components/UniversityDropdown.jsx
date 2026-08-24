import { useState, useRef, useEffect } from "react";
import { useUniversity } from "../contexts/UniversityContext";

export default function UniversityDropdown() {
  const { universities, selectedUniversity, setSelectedUniversity, loading } =
    useUniversity();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading || universities.length === 0) return null;

  return (
    <div className="university-dropdown" ref={ref}>
      <div className="university-trigger" onClick={() => setOpen((p) => !p)}>
        <span>{selectedUniversity || "Select University"}</span>
        <span className="university-chevron">▾</span>
      </div>

      {open && (
        <div className="university-menu">
          {universities.map((u) => {
            const isActive = u.name === selectedUniversity;
            return (
              <button
                key={u._id || u.name}
                className={`university-menu-item${isActive ? " active" : ""}`}
                onClick={() => {
                  setSelectedUniversity(u.name);
                  setOpen(false);
                }}
              >
                <span className="university-menu-icon">🎓</span>
                <span>{u.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}