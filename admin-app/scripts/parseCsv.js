const fs = require('fs');
const { parse } = require('csv-parse/sync');

function parseCsvString(csvString) {
  const records = parse(csvString, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
}

module.exports = { parseCsvString };
