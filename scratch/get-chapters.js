const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function main() {
  const dir = path.resolve('data/ncert/class10/maths');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
  files.sort();

  for (const file of files) {
    const dataBuffer = fs.readFileSync(path.join(dir, file));
    const data = await pdfParse(dataBuffer, { max: 1 });
    const firstLines = data.text.split('\n').filter(l => l.trim().length > 0).slice(0, 10).join(' | ');
    console.log(`${file}: ${firstLines}`);
  }
}

main().catch(console.error);
