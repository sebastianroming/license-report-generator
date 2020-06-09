/**
 * Copyright 2020
 * Sebastian Roming <sebastian@webmonkey.io>
 **/

interface ILicenseReportOptions {
  context: object,
  include: Array<string>,
  useDevDependencies: boolean,
  bowerPath: string,
  packagePath: string
};

interface INpmPackageJson {
  dependencies?: object,
  devDependencies?: object,

  [propName: string]: any
}
