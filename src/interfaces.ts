/**
 * Copyright 2020
 * Sebastian Roming <sebastian@webmonkey.io>
 **/

interface LicenseCheckerOptions {
  context: object,
  include: Array<string>,
  useDevDependencies: boolean,
  bowerPath: string,
  packagePath: string
};

interface NpmPackageJson {
  dependencies?: object,
  devDependencies?: object,

  [propName: string]: any
}
