export const PI = 3.1415926535;
export const E = 2.7182818284;

export function add(a, b) {
    return a + b;
}

export function multiply(a, b) {
    return a * b;
}

export function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
