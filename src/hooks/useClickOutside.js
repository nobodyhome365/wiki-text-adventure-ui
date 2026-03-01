import { useRef, useEffect } from 'react';

/**
 * Returns a ref to attach to a container element.
 * Calls handler whenever a mousedown occurs outside that element.
 */
export function useClickOutside(handler) {
  const ref = useRef(null);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const listener = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handlerRef.current();
    };
    document.addEventListener('mousedown', listener, true);
    return () => document.removeEventListener('mousedown', listener, true);
  }, []);

  return ref;
}
