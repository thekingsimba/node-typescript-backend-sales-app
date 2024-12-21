export const arrayRange = (start: number, stop: number, step: number) => 
Array.from({ length: (stop - start) / step + 1 },(value, index) => start + index * step);