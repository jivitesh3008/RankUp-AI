const fs = require('fs');
const pdfParse = require('pdf-parse');
async function run() {
  const data = fs.readFileSync('data/ncert/class10/science/science-class10.pdf');
  const info = await pdfParse(data);
  console.log(info.text.substring(0, 2000));
}
run();
