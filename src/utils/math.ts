export function degreeToRadian(deg: number): number {
    return deg * (Math.PI / 180);
}

export function mapping (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
    return (value - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
}