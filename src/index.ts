/**
 * Copyright 2020
 * Sebastian Roming <sebastian@webmonkey.io>
 **/

interface ILicenseReportOptions {
  include?: Array<string>,
  useDevDependencies?: boolean,
  packagePath: string,
  packageName: string,
  depth?: number,
  template?: string
};

interface INpmPackageJson {
  dependencies?: object,
  devDependencies?: object,

  [propName: string]: any
}

const nlf         = require('nlf');
const path        = require('path');
const _           = require('lodash');
const correctSpdx = require('spdx-correct');
const fs          = require('fs');

class Report {

  protected _generatedString: string;
  protected _generatedPlain: object;
  protected _warnings: Array<any>;
  protected _package: INpmPackageJson;
  protected _options: ILicenseReportOptions;

  // --------------------------------------------------------------------------------------
  constructor() {
    this._generatedString = '';
    this._generatedPlain  = {};
    this._package         = {};
    this._options         = {
      useDevDependencies: false,
      include: ['npm'],
      packagePath: process.cwd(),
      packageName: 'package.json',
      depth: 1,
      template: fs.readFileSync(path.resolve(__dirname + '/assets/', 'template.txt'), 'utf8')
    };
    this._warnings        = [];
  }

  // --------------------------------------------------------------------------------------
  toString(): string {
    return this._generatedString;
  }

  // --------------------------------------------------------------------------------------
  write(filename: string): void {
    fs.writeFileSync(filename, this._generatedString);
  }

  // --------------------------------------------------------------------------------------
  table(): Report {
    this._options.template = fs.readFileSync(path.resolve(__dirname + '/assets/', 'template-table.txt'), 'utf-8');
    return this;
  }

  // --------------------------------------------------------------------------------------
  plain(): any {
    return this._generatedPlain;
  }

  // --------------------------------------------------------------------------------------
  getPackageInfo(): INpmPackageJson {
    return this._package;
  }

  // --------------------------------------------------------------------------------------
  generate(opts: object): any {

    Object.assign(this._options, opts);

    const collectors = [];
    collectors.push(this._bootstrapNpmLicenses());

    let warnings: any = [];
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
          info.licenses = info.licenses.map((license: any) => {
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
        info.licenses = info.licenses.filter((licenseName: any) => {
          return licenseName.toLowerCase() !== 'unlicensed';
        });
        return info;
      });
    }).then(licenses => {
      return licenses.map(licenseInfo => {
        licenseInfo.licenses = licenseInfo.licenses.map((licenseName: any) => {
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
      return _.uniqBy(licenses, (info: any) => {
        return `${info.name}@${info.version}`;
      }).map((info: any) => {
        info.licenses = _.uniq(info.licenses);
        return info;
      });
    }).then(licenses => {
      licenses.sort((a: any, b: any) => {
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
      const rootPkg = require(path.resolve(this._options.packagePath, this._options.packageName));
      const pkg     = {
        name: rootPkg.name,
        version: rootPkg.version
      };

      const compiledTemplate = _.template(this._options.template);
      this._generatedPlain   = {licenses, pkg};
      this._generatedString  = compiledTemplate(this._generatedPlain);
      this._warnings         = warnings;

      return this;
    });

  }

  // --------------------------------------------------------------------------------------
  protected _bootstrapNpmLicenses(): any {
    return this._fabric().then((packages: Array<INpmPackageJson>) => {
      return packages.map((pkg: INpmPackageJson) => this._includePackageInfo(pkg));
    });
  }

  // --------------------------------------------------------------------------------------
  protected _fabric(): any {
    let rootPkg = null;
    try {
      rootPkg = require(path.resolve(this._options.packagePath, this._options.packageName));
    } catch (err) {
      return Promise.reject(err);
    }

    const _rootPackage = rootPkg;

    return this._getNpmLicenses().then((packages: Array<INpmPackageJson>) => {
      return packages.filter((pkg: INpmPackageJson) => this._isChildPackage(pkg, _rootPackage));
    }).then((packages: Array<INpmPackageJson>) => {
      return packages.filter((pkg: INpmPackageJson) => this._extractLicenses(pkg));
    });
  }

  // --------------------------------------------------------------------------------------
  protected _getNpmLicenses(): any {
    return new Promise((resolve, reject) => {
      nlf.find({
        directory: this._options.packagePath,
        depth: this._options.depth,
        production: !this._options.useDevDependencies,
        summaryMode: 'simple'
      }, (err: any, data: any) => {
        if (err) {
          return reject(err);
        }

        resolve(data);
      });
    });
  }

  // --------------------------------------------------------------------------------------
  protected _isChildPackage(pkg: INpmPackageJson, rootPkg: INpmPackageJson): boolean {
    return <boolean>(
      (Object.keys(rootPkg.dependencies || {}).includes(pkg.name)) ||
      (this._options.useDevDependencies && Object.keys(rootPkg.devDependencies || {}).includes(pkg.name))
    );
  }

  // --------------------------------------------------------------------------------------
  protected _extractLicenses(pkg: INpmPackageJson): INpmPackageJson {
    const thingsToTry = [
      pkg.licenseSources.package.summary.bind(pkg.licenseSources.package),
      pkg.licenseSources.license.summary.bind(pkg.licenseSources.license),
      pkg.licenseSources.readme.summary.bind(pkg.licenseSources.readme),
      () => {
        return ['Unknown'];
      }
    ];
    let i             = 0;
    pkg.licenses      = [];
    while (pkg.licenses.length === 0) {
      pkg.licenses = thingsToTry[i]();
      i++;
    }
    return pkg;
  }

  // --------------------------------------------------------------------------------------
  protected _includePackageInfo(pkg: INpmPackageJson): any {
    const pkgInfo = require(path.resolve(pkg.directory, this._options.packageName));
    return Object.assign({}, pkg, pkgInfo);
  }

}

exports.reporter = new Report();
