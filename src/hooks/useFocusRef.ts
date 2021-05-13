import { useRef, useLayoutEffect } from 'react';

export function useFocusRef<T extends HTMLOrSVGElement>(isCellSelected: boolean) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    if (!isCellSelected) return;
    ref.current?.focus({ preventScroll: true });
  }, [isCellSelected]);

  return ref;
}
