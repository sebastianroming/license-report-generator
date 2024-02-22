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
const _templateDir     = argv['template-dir'] || `${process.cwd()}/assets/`;
const _templateFile    = argv['template-file'] || 'template.txt';

interface CliOptions {
  template?: string
  depth?: number,
  useDevDependencies?: boolean
};

let options: CliOptions = {
  depth: _depth,
  useDevDependencies: _devDependencies
};

if (argv['template-file'] || argv['template-dir']) {
  const templateContents  = cliFs.readFileSync(cliPath.resolve(_templateDir, _templateFile), 'utf8');
  options.template        = templateContents;
}

if (_isTable) {
  cliLicenser.reporter.table().generate(options).then((rep: LicenseReport) => rep.write(cliPath.resolve(outputDirectory, outputFilename)));
} else {
  cliLicenser.reporter.generate(options).then((rep: LicenseReport) => rep.write(cliPath.resolve(outputDirectory, outputFilename)));
}

