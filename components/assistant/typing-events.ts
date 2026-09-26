/**
 * Tiny event bus between the typewriter (which knows when letters appear)
 * and the TypingSparks canvas (which knows how to draw them).
 */
export type TypingEvent =
  | { kind: "type"; el: HTMLElement; count: number }
  | { kind: "finish"; el: HTMLElement };

type Listener = (event: TypingEvent) => void;

const listeners = new Set<Listener>();

export const typingSparks = {
  emit(event: TypingEvent) {
    listeners.forEach((listener) => listener(event));
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
