"use client"

import { useRef, useEffect } from "react"

/**
 * Debounce function to throttle rapid function calls
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Debounce hook for React components
 * Automatically cleans up on unmount
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const debouncedRef = useRef<ReturnType<typeof debounce> | null>(null)

  useEffect(() => {
    return () => {
      if (debouncedRef.current) {
        debouncedRef.current = null
      }
    }
  }, [])

  if (!debouncedRef.current) {
    debouncedRef.current = debounce(callback, delay)
  }

  return debouncedRef.current
}
