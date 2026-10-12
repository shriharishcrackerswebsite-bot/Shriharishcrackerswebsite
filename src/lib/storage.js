import { useEffect, useState } from 'react';

const LIST_QTY_KEY = 'shc-product-list-quantities';

export function useListQuantities() {
  const [quantities, setQuantities] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(LIST_QTY_KEY) || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      return Object.fromEntries(
        Object.entries(parsed)
          .map(([id, quantity]) => [id, Math.max(0, Math.round(Number(quantity) || 0))])
          .filter(([, quantity]) => quantity > 0),
      );
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(LIST_QTY_KEY, JSON.stringify(quantities));
  }, [quantities]);

  const setQuantity = (id, quantity) => {
    setQuantities(current => {
      const next = { ...current };
      const safe = Math.max(0, Math.round(Number(quantity) || 0));
      if (safe <= 0) delete next[id];
      else next[id] = safe;
      return next;
    });
  };

  const reset = () => setQuantities({});

  return { quantities, setQuantity, reset };
}
