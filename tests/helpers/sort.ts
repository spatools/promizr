export default function sort(list: number[]): number[] {
    return [...list].sort((a, b) => a - b);
} 