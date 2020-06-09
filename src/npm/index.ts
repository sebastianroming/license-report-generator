/**
 * Copyright 2020
 * Sebastian Roming <sebastian@webmonkey.io>
 **/

const nlf = require('nlf');

class FetchNpmLicenses {

  opts: LicenseCheckerOptions;

  protected _defaultOpts: LicenseCheckerOptions;
  protected _rootPkg: NpmPackageJson;

  // --------------------------------------------------------------------------------------
  constructor() {
    this._defaultOpts = this.opts = {
      context: {},
      include: ['npm'],
      useDevDependencies: false,
      bowerPath: process.cwd(),
      packagePath: process.cwd()
    };

    this._rootPkg = {};
  }

  // --------------------------------------------------------------------------------------
  setOptions(opts: object): void {
    this.opts = Object.assign({}, this._defaultOpts, opts);
  }

  // --------------------------------------------------------------------------------------
  getLicenses(): any {

    return new Promise((resolve, reject) => {

      nlf.find({
        directory: this.opts.packagePath,
        depth: 1,
        production: !this.opts.useDevDependencies,
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
  isChildPackage(pkg: any): boolean {
    return (
      (this.opts.include.includes('npm') && Object.keys(this._rootPkg.dependencies || {}).includes(pkg.name)) ||
      (this.opts.include.includes('dev') && Object.keys(this._rootPkg.devDependencies || {}).includes(pkg.name))
    );
  }

}
