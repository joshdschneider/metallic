export function classnames(...arr: unknown[]) {
  return arr.filter(Boolean).join(' ');
}
