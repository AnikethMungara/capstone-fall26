import { promises as fs } from "node:fs";
import path from "node:path";
import { toCsv, parseCsv } from "./csv.js";
import { COLUMNS, flatten, rowKey, validate } from "./flatten.js";

// CSV-backed store. The CSV file is the source of truth: it is loaded on start,
// rows are upserted by (respondentId, surveyType, moduleId, questionId) so
// resubmits never duplicate, and every write goes to a temp file then renames
// so a crash can't leave a half-written CSV. Writes are serialised.

export async function createStore(file) {
  const rows = new Map();

  try {
    const [header, ...body] = parseCsv(await fs.readFile(file, "utf8"));
    if (header) {
      for (const cells of body) {
        if (cells.length === 1 && cells[0] === "") continue;
        const row = Object.fromEntries(COLUMNS.map((c) => [c, cells[header.indexOf(c)] ?? ""]));
        rows.set(rowKey(row), row);
      }
    }
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }

  let chain = Promise.resolve();
  const serialised = (fn) => {
    const run = chain.then(fn);
    chain = run.catch(() => {});
    return run;
  };

  async function persist() {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, toCsv(COLUMNS, [...rows.values()]));
    await fs.rename(tmp, file);
  }

  return {
    // Returns { saved, rejected: [{index, error}], total }.
    upsert: (records) =>
      serialised(async () => {
        const receivedAt = new Date().toISOString();
        const rejected = [];
        let saved = 0;
        records.forEach((rec, index) => {
          const error = validate(rec);
          if (error) return rejected.push({ index, error });
          const row = flatten(rec, receivedAt);
          rows.set(rowKey(row), row);
          saved++;
        });
        if (saved) await persist();
        return { saved, rejected, total: rows.size };
      }),
    all: () => [...rows.values()],
    csv: () => toCsv(COLUMNS, [...rows.values()]),
    size: () => rows.size,
  };
}
