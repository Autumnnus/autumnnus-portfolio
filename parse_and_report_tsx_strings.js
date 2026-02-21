const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');
const fs = require('fs');

const project = new Project({
  tsConfigFilePath: path.join(__dirname, 'tsconfig.json'),
});

const tsxFiles = project.getSourceFiles('components/**/*.tsx').concat(project.getSourceFiles('app/**/*.tsx'));

let totalRawStrings = [];

for (const sourceFile of tsxFiles) {
  const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  const jsxAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute);
  
  // Find raw JSX text (excluding pure whitespace)
  const rawTexts = jsxTexts.map(t => t.getText().trim()).filter(t => t.length > 0 && /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(t) && !t.includes('import ') && !t.startsWith('{'));
  
  if (rawTexts.length > 0) {
    totalRawStrings.push({ file: sourceFile.getFilePath(), texts: rawTexts });
  }
}

fs.writeFileSync('raw_strings_report.json', JSON.stringify(totalRawStrings, null, 2));
console.log(`Found ${totalRawStrings.length} files with raw JSX text.`);
