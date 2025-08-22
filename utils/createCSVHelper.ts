import fs from "fs";
import path from "path";

export type dataType = Array<{
  code: string;
  name: string;
  currency: string;
  marketCap: string;
  netChange: string;
  percentualchange: string;
}>;

export function writeToCSV(data: dataType, fileName: string) {
  const headers = Object.keys(data[0]).join(",");
  const rowsCSV = data
    .map((row) =>
      Object.values(row)
        .map((val) => `"${val}"`)
        .join(",")
    )
    .join("\n");

  const csvContent = `${headers}\n${rowsCSV}`;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputFolder = path.join(__dirname, "..", "reports");
  const csvFile = path.join(outputFolder, `${fileName}_${timestamp}.csv`);

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  fs.writeFileSync(csvFile, csvContent);

  console.log(`File generated: ${csvFile}`);
}
