import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Markdown formatındaki URL'leri temizler
 * Örnek: "[https://example.com](https://example.com)" -> "https://example.com"
 */
export function cleanUrl(url: string): string {
  return url
    .replace(/\[|\]/g, "") // Markdown bağlantı köşeli parantezleri kaldır
    .replace(/\(|\)/g, "") // Markdown bağlantı parantezleri kaldır
    .trim() // Boşlukları temizle
}
