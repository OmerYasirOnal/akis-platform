export function addSeconds(date: Date, seconds: number): Date {
  const next = new Date(date);
  next.setSeconds(next.getSeconds() + seconds);
  return next;
}


