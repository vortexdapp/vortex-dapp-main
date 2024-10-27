const fs = require("fs");
const { parse } = require("csv-parse/sync");

const fileContent = fs.readFileSync("holders.csv", { encoding: "utf-8" });
const records = parse(fileContent, {
  columns: true,
  skip_empty_lines: true,
});

// Assuming the filtered list is stored in a variable `filteredHolders`
const filteredHolders = records.filter(
  (record) =>
    record.HolderAddress !== "0x000000000000000000000000000000000000dead" &&
    record.HolderAddress !== "0xff3151e67db7206765a6c8ba1ac822674ec7eaf9"
);

console.log(
  "Total number of addresses after filtering:",
  filteredHolders.length
);
console.log(filteredHolders.map((holder) => holder.HolderAddress)); // This will print all addresses
