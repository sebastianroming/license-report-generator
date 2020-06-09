/**
 * Copyright 2020
 * Sebastian Roming <sebastian@webmonkey.io>
 **/

const fs = require('fs');

class Report {

  protected _generatedString: string;
  protected _package: object;

  // --------------------------------------------------------------------------------------
  constructor() {
    this._generatedString = '';
    this._package         = {};
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
  getPackageInfo(): object {
    return this._package;
  }

}
