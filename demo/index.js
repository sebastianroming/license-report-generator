const path = require('path');
const fs = require('fs');
const licenser = require('../dist');


const templateFile = path.resolve(__dirname, 'template-table.txt');
const templateContents = fs.readFileSync(templateFile, 'utf8');

const config = {
  template: templateContents
};

licenser.reporter.generate(config).then(rep => rep.table()).then(rep => rep.write(path.resolve(__dirname, 'output.md')));
//rep.write(path.resolve(__dirname, 'output.md')));
//rep => console.log(rep.plain()));
