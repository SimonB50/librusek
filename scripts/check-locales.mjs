// Compares every locale with Polish (the source): same namespaces, same keys, same {{placeholders}}.
// Plural keys (`_one`, `_few`, `_many`, `_other`...) are compared by their base name, since languages use different forms.
import {readdirSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = fileURLToPath(new URL("../src/locales/", import.meta.url));
const SOURCE = "pl";
const PLURAL = /_(zero|one|two|few|many|other)$/;

const flatten = (value, prefix = "") => Object.entries(value).flatMap(([key, item]) =>
  item && typeof item === "object" ? flatten(item, `${prefix}${key}.`) : [[`${prefix}${key}`, String(item)]]);

/** base key -> sorted placeholders of all its forms */
const shape = (file) => {
  const result = new Map();
  const entries = flatten(JSON.parse(readFileSync(file, "utf8")));
  // A suffix is a plural form only when the key has at least two forms (`delete_one` alone is a normal key)
  const forms = new Map();
  for (const [key] of entries) if (PLURAL.test(key)) forms.set(key.replace(PLURAL, ""), (forms.get(key.replace(PLURAL, "")) ?? 0) + 1);
  for (const [key, text] of entries) {
    const stripped = key.replace(PLURAL, "");
    const base = (forms.get(stripped) ?? 0) > 1 ? stripped : key;
    const vars = new Set([...(result.get(base) ?? []), ...(text.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map(v => v.replace(/\s/g, ""))]);
    result.set(base, [...vars].sort());
  }
  return result;
};

const problems = [];
const namespaces = readdirSync(join(ROOT, SOURCE));
for (const language of readdirSync(ROOT).filter(name => name !== SOURCE)) {
  const files = new Set(readdirSync(join(ROOT, language)));
  for (const file of namespaces) {
    if (!files.has(file)) {
      problems.push(`${language}: missing ${file}`);
      continue;
    }
    const source = shape(join(ROOT, SOURCE, file));
    const target = shape(join(ROOT, language, file));
    for (const [key, vars] of source) {
      if (!target.has(key)) problems.push(`${language}/${file}: missing ${key}`);
      else if (target.get(key).join() !== vars.join()) problems.push(`${language}/${file}: placeholders differ in ${key}`);
    }
    for (const key of target.keys()) if (!source.has(key)) problems.push(`${language}/${file}: extra ${key}`);
  }
  for (const file of files) if (!namespaces.includes(file)) problems.push(`${language}: extra ${file}`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} locale problem(s)`);
  process.exit(1);
}
console.log("Locales match the Polish source.");
