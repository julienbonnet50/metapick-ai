interface PlayerAccountHelper {
  name: string;
  score: number | null;
  total_power_points: number;
  total_coins: number;
  [key: string]: string | number | null; // Add index signature
}