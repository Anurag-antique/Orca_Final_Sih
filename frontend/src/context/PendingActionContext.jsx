import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';

const PendingActionContext = createContext(null);

let idCounter = 0;

export function PendingActionProvider({ children }) {
  const [pending, setPending] = useState([]);

  const remember = useCallback((label) => {
    const id = ++idCounter;
    setPending((prev) => [...prev, { id, label, addedAt: Date.now() }]);
    return id;
  }, []);

  const forget = useCallback((id) => {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setPending([]), []);

  return (
    <PendingActionContext.Provider value={{ pending, remember, forget, clear }}>
      {children}
    </PendingActionContext.Provider>
  );
}

export function usePendingActions() {
  const ctx = useContext(PendingActionContext);
  if (!ctx) {
    throw new Error(
      'usePendingActions must be used within a PendingActionProvider'
    );
  }
  return ctx;
}