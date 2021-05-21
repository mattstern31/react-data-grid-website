import 'core-js/stable';
import { act } from 'react-dom/test-utils';

window.ResizeObserver ??= class {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe() {
    this.callback([], this);
  }

  unobserve() {}
  disconnect() {}
};

// patch clientWidth/clientHeight to pretend we're rendering DataGrid at 1080p
Object.defineProperties(HTMLDivElement.prototype, {
  clientWidth: {
    get(this: HTMLDivElement) {
      return this.classList.contains('rdg') ? 1920 : 0;
    }
  },
  clientHeight: {
    get(this: HTMLDivElement) {
      return this.classList.contains('rdg') ? 1080 : 0;
    }
  }
});

// Basic scroll polyfill
const scrollStates = new WeakMap<Element, { scrollTop: number; scrollLeft: number }>();

function getScrollState(div: Element) {
  if (scrollStates.has(div)) {
    return scrollStates.get(div)!;
  }
  const scrollState = { scrollTop: 0, scrollLeft: 0 };
  scrollStates.set(div, scrollState);
  return scrollState;
}

Object.defineProperties(Element.prototype, {
  scrollTop: {
    get(this: Element) {
      return getScrollState(this).scrollTop;
    },
    set(this: Element, value: number) {
      getScrollState(this).scrollTop = value;
      act(() => {
        this.dispatchEvent(new Event('scroll'));
      });
    }
  },
  scrollLeft: {
    get(this: Element) {
      return getScrollState(this).scrollLeft;
    },
    set(this: Element, value: number) {
      getScrollState(this).scrollLeft = value;
      act(() => {
        this.dispatchEvent(new Event('scroll'));
      });
    }
  }
});
