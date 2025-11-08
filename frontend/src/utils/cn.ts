export function cn(
  ...classes: Array<string | number | bigint | false | null | undefined>
): string {
  return classes
    .flatMap((value) => {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
      if (typeof value === 'number') {
        return String(value);
      }
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return [];
    })
    .join(' ');
}

