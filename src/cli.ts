#!/usr/bin/env node

const cliPath = require('path');
const cliFs = require('fs');
const { argv } = require('yargs');
const cliLicenser = require('./index');

const outputDirectory = argv['out-dir'];
const outputFilename = argv['out-file'];

const templateDirectory = argv['template-dir'] || `${__dirname}/assets/`;
const templateFilename = argv['template-file'] || 'template.txt';
const templateFile = cliPath.resolve(templateDirectory, templateFilename);

//const templateFile = cliPath.resolve(__dirname + '/assets/', 'template-table.txt');
const templateContents = cliFs.readFileSync(templateFile, 'utf8');

const options = {
  template: templateContents
};

cliLicenser.reporter.generate(options).then((rep: Report) => rep.table()).then((rep: Report) => rep.write(cliPath.resolve(outputDirectory, outputFilename)));
