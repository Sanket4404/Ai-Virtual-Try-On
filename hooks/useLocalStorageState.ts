import { useState, useEffect } from 'react';

// A generic custom hook to manage state with localStorage.
export function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    // Initialize state from localStorage on component mount.
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue) {
        return JSON.parse(storedValue);
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
    // If no value in localStorage, use the defaultValue.
    return defaultValue;
  });

  // Use useEffect to save state to localStorage whenever it changes.
  useEffect(() => {
    try {
      if (state === null || (Array.isArray(state) && state.length === 0)) {
        // Remove item from storage if state is null or an empty array to keep storage clean.
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (error) {
      console.error(`Error writing to localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
}
