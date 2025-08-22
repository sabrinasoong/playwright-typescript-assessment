export interface HistoricalData {
  _DATE_END: string;
  LOW_1: string;
  CLOSE_PRC: string;
  HIGH_1: string;
  OPEN_PRC: string;
}

export function getLowestIndexMonth(data: HistoricalData[]): string {
  // Groups all lowest  values for each month
  const monthlyGroups: Record<string, number[]> = {};

  data.forEach((e) => {
    const date = new Date(e._DATE_END);
    const key = `${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${date.getFullYear()}`;
    const low = parseFloat(e.LOW_1);

    if (!monthlyGroups[key]) {
      monthlyGroups[key] = [];
    }

    monthlyGroups[key].push(low);
  });

  // Calculate the average of each month's values
  const monthlyAverages: Record<string, number> = {};
  for (const key in monthlyGroups) {
    const values = monthlyGroups[key];
    const sum = values.reduce((acc, val) => acc + val, 0);
    monthlyAverages[key] = sum / values.length;
  }

  // Find the lowest average value's month and return it
  const minAverage = Math.min(...Object.values(monthlyAverages));
  const lowestMonth = Object.keys(monthlyAverages).find(
    (key) => monthlyAverages[key] === minAverage
  );

  return lowestMonth!;
}
