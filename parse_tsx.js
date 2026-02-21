const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");
const fs = require("fs");

const project = new Project({
  tsConfigFilePath: path.join(__dirname, "tsconfig.json"),
});

const tsxFiles = project.getSourceFiles("**/*.tsx");

let totalRawStrings = [];

for (const sourceFile of tsxFiles) {
  const file = sourceFile.getFilePath();
  if (file.includes("node_modules") || file.includes(".next")) continue;

  const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  // Also common texts in buttons or labels

  // Find raw JSX text
  const rawTexts = jsxTexts
    .map((t) => t.getText().trim())
    .filter(
      (t) =>
        t.length > 0 &&
        /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(t) &&
        !t.includes("import ") &&
        !t.startsWith("{"),
    );

  if (rawTexts.length > 0) {
    totalRawStrings.push({
      file: file.replace(__dirname, ""),
      texts: rawTexts,
    });
  }
}

fs.writeFileSync(
  "raw_strings_report.json",
  JSON.stringify(totalRawStrings, null, 2),
);
console.log(`Found ${totalRawStrings.length} files with raw JSX text.`);
