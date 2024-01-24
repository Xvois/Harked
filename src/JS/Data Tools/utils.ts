
export function hashString(inputString: string) {
    // @ts-ignore
    let hash = 0n; // Use BigInt to support larger values
    if (inputString.length === 0) {
        return '0000000000000000';
    }
    for (let i = 0; i < inputString.length; i++) {
        const char = BigInt(inputString.charCodeAt(i));
        // @ts-ignore
        hash = ((hash << 5n) - hash) + char;
        hash &= hash; // Convert to 64-bit integer
    }
    const hex = hash.toString(16);
    return hex.padStart(15, '0').substring(0, 15);
}

export const milliToHighestOrder = function (milliseconds: number) {
    const units = [
        { value: 1, unit: 's' },
        { value: 60, unit: 'm' },
        { value: 60 * 60, unit: 'hr' },
        { value: 24 * 60 * 60, unit: 'd' },
        { value: 7 * 24 * 60 * 60, unit: 'w' },
        { value: 30 * 24 * 60 * 60, unit: 'm' },
        { value: 12 * 30 * 24 * 60 * 60, unit: 'yr' },
    ];

    let calcVal = milliseconds / 1000;
    let unit = 's';

    for (let i = units.length - 1; i >= 0; i--) {
        if (calcVal >= units[i].value) {
            calcVal /= units[i].value;
            unit = units[i].unit;
            break;
        }
    }

    return {
        value: Math.trunc(calcVal),
        unit: unit
    }
}

export function chunks(array: any[], size: number) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}