import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatTime12h(timeStr: string | undefined | null): string {
    if (!timeStr) return '';
    try {
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;
        let h = parseInt(parts[0], 10);
        const m = parts[1];
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // hour '0' should be '12'
        return `${h}:${m} ${ampm}`;
    } catch {
        return timeStr;
    }
}
