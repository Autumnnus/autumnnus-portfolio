import fs from "fs";
import path from "path";
import { JsxExpression, Project, StringLiteral, SyntaxKind } from "ts-morph";

const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), "tsconfig.json"),
});

const files = project.getSourceFiles(["app/**/*.tsx", "components/**/*.tsx"]);

const ATTRIBUTES_TO_CHECK = [
  "placeholder",
  "title",
  "label",
  "aria-label",
  "alt",
];
const TEXT_REGEX = /[a-zA-ZğüşıöçĞÜŞİÖÇ]/;

interface Detection {
  line: number;
  text: string;
  type: "JsxText" | "Attribute";
  attributeName?: string;
}

const results: Record<string, Detection[]> = {};

console.log(`Scanning ${files.length} files...`);

for (const file of files) {
  const detections: Detection[] = [];
  const filePath = path.relative(process.cwd(), file.getFilePath());

  file.getDescendantsOfKind(SyntaxKind.JsxText).forEach((node) => {
    const text = node.getText().trim();
    if (text.length > 0 && TEXT_REGEX.test(text) && !text.includes("import ")) {
      detections.push({
        line: node.getStartLineNumber(),
        text,
        type: "JsxText",
      });
    }
  });

  file.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach((attr) => {
    const attrName = attr.getNameNode().getText();
    if (ATTRIBUTES_TO_CHECK.includes(attrName)) {
      const initializer = attr.getInitializer();
      if (initializer?.getKind() === SyntaxKind.StringLiteral) {
        const text = (initializer as StringLiteral).getLiteralValue().trim();
        if (text.length > 0 && TEXT_REGEX.test(text)) {
          detections.push({
            line: attr.getStartLineNumber(),
            text,
            type: "Attribute",
            attributeName: attrName,
          });
        }
      } else if (initializer?.getKind() === SyntaxKind.JsxExpression) {
        const expression = initializer as JsxExpression;
        const literal = expression.getExpressionIfKind(
          SyntaxKind.StringLiteral,
        );
        if (literal) {
          const text = literal.getLiteralValue().trim();
          if (text.length > 0 && TEXT_REGEX.test(text)) {
            detections.push({
              line: attr.getStartLineNumber(),
              text,
              type: "Attribute",
              attributeName: attrName,
            });
          }
        }
      }
    }
  });

  if (detections.length > 0) {
    results[filePath] = detections.sort((a, b) => a.line - b.line);
  }
}

fs.writeFileSync(
  path.join(process.cwd(), "i18n-scan-results.json"),
  JSON.stringify(results, null, 2),
);

const fileCount = Object.keys(results).length;
if (fileCount === 0) {
  console.log("\n✅ No hardcoded strings detected!");
} else {
  console.log(
    `\n❌ Found hardcoded strings in ${fileCount} files. Detailed report saved to i18n-scan-results.json\n`,
  );
  for (const [file, detections] of Object.entries(results)) {
    console.log(`\x1b[1m\x1b[34m${file}\x1b[0m`);
    detections.slice(0, 5).forEach((d) => {
      const typeLabel =
        d.type === "Attribute" ? `Attr(${d.attributeName})` : "Text";
      console.log(
        `  \x1b[33mLine ${d.line}:\x1b[0m [${typeLabel}] "${d.text}"`,
      );
    });
    if (detections.length > 5)
      console.log(`  ... and ${detections.length - 5} more`);
    console.log("");
  }
  console.log(`Total detected issues: ${Object.values(results).flat().length}`);
}
