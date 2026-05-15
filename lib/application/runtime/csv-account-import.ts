export const CSV_ACCOUNT_IMPORT_SAMPLE = `Company,Street,City,State,Postal Code,Owner,Status
DynaLites Albany,10 Market St,Albany,NY,12207,Avery,Prospect
DynaLites Syracuse,200 Erie Blvd,Syracuse,NY,13202,Jordan,Active`;

export type CsvAccountImportPreviewRow = {
  rowNumber: number;
  sourceRowId: string;
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  owner: string;
  status: string;
  errors: string[];
};

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      quoted = !quoted;
      continue;
    }

    if (character === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function firstCell(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value?.trim()) {
      return value.trim();
    }
  }
  return "";
}

function buildSourceRowId(row: CsvAccountImportPreviewRow) {
  return (
    [row.name, row.addressLine1, row.city, row.state, row.postalCode]
      .filter(Boolean)
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `csv-row-${row.rowNumber}`
  );
}

export function parseCsvAccountImportPreview(csvText: string): CsvAccountImportPreviewRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const rawRow = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
    const row: CsvAccountImportPreviewRow = {
      rowNumber: index + 2,
      sourceRowId: "",
      name: firstCell(rawRow, ["company", "companyname", "account", "accountname", "name", "customer", "customername"]),
      addressLine1: firstCell(rawRow, ["street", "address", "address1", "addressline1", "line1"]),
      city: firstCell(rawRow, ["city", "town"]),
      state: firstCell(rawRow, ["state", "province", "region"]),
      postalCode: firstCell(rawRow, ["postalcode", "postcode", "zip", "zipcode"]),
      country: firstCell(rawRow, ["country"]) || "US",
      owner: firstCell(rawRow, ["owner", "rep", "salesrep", "accountowner"]),
      status: firstCell(rawRow, ["status", "accountstatus", "stage"]),
      errors: [],
    };

    row.sourceRowId = buildSourceRowId(row);
    if (!row.name) {
      row.errors.push("Company name is required.");
    }
    if (!row.addressLine1 && !(row.city && row.state) && !row.postalCode) {
      row.errors.push("A usable location is required.");
    }

    return row;
  });
}
