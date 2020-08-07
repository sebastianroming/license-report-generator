#!/usr/bin/env node

const cliPath     = require('path');
const cliFs       = require('fs');
const {argv}      = require('yargs');
const cliLicenser = require('./index');

const outputDirectory = argv['out-dir'] || `${process.cwd()}`;
const outputFilename  = argv['out-file'] || 'license-output.md';

const _isTable         = argv['table'] || false;
const _depth           = argv['depth'] || 1;
const _devDependencies = argv['with-dev-dependencies'] || false;

interface ICliOptions {
  template?: string
  depth?: number,
  useDevDependencies?: boolean
};

let options: ICliOptions = {
  depth: _depth,
  useDevDependencies: _devDependencies
};

if (argv['template-file']) {
  const templateDirectory = argv['template-dir'] || `${process.cwd()}/assets/`;
  const templateFilename  = argv['template-file'] || 'template.txt';
  const templateContents  = cliFs.readFileSync(cliPath.resolve(templateDirectory, templateFilename), 'utf8');
  options.template        = templateContents;
}

if (_isTable) {
  cliLicenser.reporter.table().generate(options).then((rep: Report) => rep.write(cliPath.resolve(outputDirectory, outputFilename)));
} else {
  cliLicenser.reporter.generate(options).then((rep: Report) => rep.write(cliPath.resolve(outputDirectory, outputFilename)));
}

