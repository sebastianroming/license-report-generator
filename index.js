'use strict';
/* eslint-disable no-unused-vars */

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const nlf = require('nlf');
const correctSpdx = require('spdx-correct');
const bowerLicenses = require('./bower');

const templateFile = path.resolve(__dirname, 'template.txt');
const templateContents = fs.readFileSync(templateFile, 'utf8');

const defaultOpts = {
  context: {},
  include: ['npm'],
  path: process.cwd(),
  template: templateContents
};

class Report {
  constructor() {
    this.package = {};
    this.generated = '';
    this.licenses = [];
    this.warnings = [];
  }

  toString() {
    return this.generated;
  }

  write(filename) {
    fs.writeFileSync(filename, this.generated);
  }

  getPackageInfo() {
    return this.package;
  }
}

const getLicensesBower = opts => {
  const bowerDir = path.join(opts.path, 'bower_components');
  const isAGuess = str => {
    return str.match(/\*$/);
  };
  const isNotAGuess = str => {
    return !isAGuess(str);
  };
  return new Promise((resolve, reject) => {
    bowerLicenses.init({directory: bowerDir}, (licenses, err) => {
      if (err) {
        return reject(err);
      }
      const warnings = [];
      const reformatted = Object.keys(licenses).map(key => {
        const data = licenses[key];
        const [unused, name, version] = key.match(/^(.*)@(.*)$/);
        data.name = name;
        if (typeof data.licenses === 'string') {
          data.licenses = [data.licenses];
        }
        if (data.licenses.some(isNotAGuess)) {
          data.licenses = data.licenses.filter(isNotAGuess);
        } else {
          data.licenses = data.licenses.map(license => {
            const stripped = license.replace(/\*$/, '');
            warnings.push(
              `${data.name} module does not have a "license" property, ` +
              `inferring as ${stripped}`);
            return stripped;
          });
        }
        data.version = version;
        return data;
      });
      reformatted.warnings = warnings;
      resolve(reformatted);
    });
  });
};

const getLicensesNpm = opts => {
  const lookupLicenses = () => {
    let rootPkg;
    try {
      rootPkg = require(path.resolve(opts.path, 'package.json'));
    } catch (error) {
      return Promise.reject(error);
    }

    const getLicenses = () => {
      return new Promise((resolve, reject) => {
        nlf.find({
          directory: opts.path,
          depth: 1,
          production: !opts.include.includes('dev'),
          summaryMode: 'simple'
        }, (err, data) => {
          if (err) {
            return reject(err);
          }
          resolve(data);
        });
      });
    };

    const isChildPackage = pkg => {
      return (
        (opts.include.includes('npm') && Object.keys(rootPkg.dependencies || {}).includes(pkg.name)) ||
        (opts.include.includes('dev') && Object.keys(rootPkg.devDependencies || {}).includes(pkg.name))
      );
    };

    const extractLicenses = pkg => {
      const thingsToTry = [
        pkg.licenseSources.package.summary.bind(pkg.licenseSources.package),
        pkg.licenseSources.license.summary.bind(pkg.licenseSources.license),
        pkg.licenseSources.readme.summary.bind(pkg.licenseSources.readme),
        () => {
          return ['Unknown'];
        }
      ];
      let i = 0;
      pkg.licenses = [];
      while (pkg.licenses.length === 0) {
        pkg.licenses = thingsToTry[i]();
        i++;
      }
      return pkg;
    };

    return getLicenses().then(pkgs => {
      return pkgs.filter(isChildPackage);
    }).then(pkgs => {
      return pkgs.map(extractLicenses);
    });
  };

  const includePackageInfo = info => {
    const pkgInfo = require(path.resolve(info.directory, 'package.json'));
    return Object.assign({}, info, pkgInfo);
  };

  return lookupLicenses().then(pkgs => {
    return pkgs.map(includePackageInfo);
  });
};

const generateReport = opts => {
  opts = Object.assign({}, defaultOpts, opts);

  const collectors = [];
  if (opts.include.includes('npm') || opts.include.includes('dev')) {
    collectors.push(getLicensesNpm(opts));
  }
  if (opts.include.includes('bower')) {
    collectors.push(getLicensesBower(opts));
  }

  let warnings = [];
  return Promise.all(collectors).then(results => {
    results.forEach(result => {
      if (result.warnings) {
        warnings = warnings.concat(result.warnings);
      }
    });
    return Array.prototype.concat.apply([], results);
  }).then(licenses => {
    return licenses.map(info => {
      if (info.licenses.length > 0) {
        info.licenses = info.licenses.map(license => {
          if (typeof license === 'string') {
            return license;
          }
          if (license.type) {
            return license.type;
          }
          return 'Unknown';
        });
      }

      return info;
    });
  }).then(licenses => {
    return licenses.map(info => {
      info.licenses = info.licenses.filter(licenseName => {
        return licenseName.toLowerCase() !== 'unlicensed';
      });
      return info;
    });
  }).then(licenses => {
    return licenses.map(licenseInfo => {
      licenseInfo.licenses = licenseInfo.licenses.map(licenseName => {
        const corrected = correctSpdx(licenseName);
        if (corrected) {
          return corrected;
        }

        if (licenseName === 'UNKNOWN') {
          return 'Unknown';
        }

        return licenseName;
      });
      return licenseInfo;
    });
  }).then(licenses => {
    return _.uniqBy(licenses, info => {
      return `${info.name}@${info.version}`;
    }).map(info => {
      info.licenses = _.uniq(info.licenses);
      return info;
    });
  }).then(licenses => {
    licenses.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    return licenses;
  }).then(licenses => {
    const rootPkg = require(path.resolve(opts.path, 'package.json'));
    const pkg = {
      name: rootPkg.name,
      version: rootPkg.version
    };

    const report = new Report();
    const compiledTemplate = _.template(opts.template);
    const context = Object.assign({}, opts.context, {licenses, pkg});
    report.generated = compiledTemplate(context);
    report.warnings = warnings;
    return report;
  });
};

exports.generateReport = generateReport;
