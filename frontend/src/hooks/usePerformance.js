import { useCallback, useRef, useState, useEffect } from 'react';

/**
 * Hook for memoizing expensive computations
 * @param {Function} compute - Function to compute the value
 * @param {Array} deps - Dependencies array
 * @returns {any} Memoized value
 */
export function useMemoizedValue(compute, deps) {
  const memoRef = useRef();
  const depsRef = useRef();

  // Check if dependencies have changed
  const depsChanged = !depsRef.current || 
    deps.length !== depsRef.current.length ||
    deps.some((dep, index) => dep !== depsRef.current[index]);

  if (depsChanged) {
    memoRef.current = compute();
    depsRef.current = deps;
  }

  return memoRef.current;
}

/**
 * Hook for throttling function calls
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Throttle delay in milliseconds
 * @returns {Function} Throttled function
 */
export function useThrottle(callback, delay) {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
}

/**
 * Hook for lazy loading images
 * @param {string} src - Image source
 * @param {string} placeholder - Placeholder image
 * @returns {{src: string, loading: boolean, error: boolean}}
 */
export function useLazyImage(src, placeholder = '') {
  const [state, setState] = useState({
    src: placeholder,
    loading: true,
    error: false,
  });

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setState({
        src,
        loading: false,
        error: false,
      });
    };

    img.onerror = () => {
      setState({
        src: placeholder,
        loading: false,
        error: true,
      });
    };

    img.src = src;
  }, [src, placeholder]);

  return state;
}

/**
 * Hook for intersection observer (for virtualization)
 * @param {Object} options - Intersection observer options
 * @returns {[Function, boolean]} [ref callback, isIntersecting]
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [node, setNode] = useState(null);

  const ref = useCallback((node) => {
    setNode(node);
  }, []);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, options]);

  return [ref, isIntersecting];
}
