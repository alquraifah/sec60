export function fmtNumber(n: number): string {
  return Math.round(n).toLocaleString();
}

export function fmtDecimal(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}
