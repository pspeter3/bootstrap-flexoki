// The Flexoki hues and shades shared by the token sync script and the tests.
export const HUES = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "magenta"];
export const SHADES = [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950];

// Bootstrap names its 50 stop "050".
export function stop(shade: number): string {
  return shade < 100 ? `0${shade}` : `${shade}`;
}
