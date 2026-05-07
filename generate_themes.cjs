const fs = require('fs');
const path = require('path');

const themesDir = path.join(__dirname, 'themes');
const inlinePath = path.join(__dirname, 'themes.inline.json');
const indexPath = path.join(__dirname, 'index.html');

const entries = fs.readdirSync(themesDir).filter((name) => name.endsWith('.json'));
const data = {};

for (const file of entries) {
  const key = path.basename(file, '.json');
  const content = JSON.parse(fs.readFileSync(path.join(themesDir, file), 'utf-8'));
  data[key] = content;
}

const inlineJson = JSON.stringify(data, null, 2);
fs.writeFileSync(inlinePath, inlineJson);
console.log('Wrote themes.inline.json');

try {
  let indexSource = fs.readFileSync(indexPath, 'utf-8');
  const startToken = 'const builtInThemes = JSON.parse(String.raw`';
  const endToken = '`);';
  const startIndex = indexSource.indexOf(startToken);

  if (startIndex === -1) {
    console.warn('Could not find builtInThemes block in index.html; skipping inline replacement.');
  } else {
    const jsonStart = startIndex + startToken.length;
    const endIndex = indexSource.indexOf(endToken, jsonStart);

    if (endIndex === -1) {
      console.warn('Could not locate String.raw closing token in index.html; skipping inline replacement.');
    } else {
      const inlineJsonForHtml = JSON.stringify(data, null, 4);
      indexSource = `${indexSource.slice(0, jsonStart)}${inlineJsonForHtml}${indexSource.slice(endIndex)}`;
      fs.writeFileSync(indexPath, indexSource);
      console.log('Updated builtInThemes inline JSON in index.html');
    }
  }
} catch (error) {
  console.warn('Failed to update inline theme data in index.html:', error.message);
}
