export function round(number, inDigit) {
    let t = 1;
    let digit = inDigit;
    for (; digit > 0; t *= 10, digit -= 1) ;
    for (; digit < 0; t /= 10, digit += 1) ;
    return Math.round(number * t) / t;
}
