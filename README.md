# license-report-generator [![Build Status](https://travis-ci.org/sebastianroming/license-report-generator.svg?branch=master)](https://travis-ci.org/sebastianroming/license-report-generator)

> finds and stores all dependency licenses

## Install
```
npm install --save @webmonkey/license-report-generator
```
or if you're using yarn:
```
yarn add @webmonkey/license-report-generator
```


## Usage

#### Options 
```
{
  useDevDependencies: boolean, // defaults to 'false'
  packagePath: string,         // defaults to 'process.cwd()'
  packageName: string,         // defaults to 'package.json'
  depth: number,               // defaults to '1'
  template: string,            // defaults to the contents of assets/template.txt
}
```

### Examples

#### Find licenses and write to file
```js
const licenser = require('@webmonkey/license-report-generator');

const options = { 
  useDevDependencies: true
};

return licenser.reporter.generate(options)
                        .then(rep => rep.write(path.resolve(__dirname, 'output.md')))
                        .catch((error) => {
                          console.log(error);
                        });
```

#### Return licenses as plain object
```js
const licenser = require('@webmonkey/license-report-generator');

const options = { 
  useDevDependencies: true,
  depth: 2
};

return licenser.reporter.generate(options)
                        .then(rep => console.log(rep.plain()))
                        .catch((error) => {
                          console.log(error);
                        });
```

#### Use with your own template
```js
const licenser = require('@webmonkey/license-report-generator');
const fs       = require('fs');
const path     = require('path');

const options = {
  template: fs.readFileSync(path.resolve(__dirname, 'template-table.txt'), 'utf8')
};

return licenser.reporter.generate(options)
                        .then(rep => rep.write(path.resolve(__dirname, 'output.md')))
                        .catch((error) => {
                          console.log(error);
                        });
```

#### Use with default table template
```js
const licenser = require('@webmonkey/license-report-generator');

return licenser.reporter.generate({})
                        .then(rep => rep.table())
                        .then(rep => rep.write(path.resolve(__dirname, 'output.md')))
                        .catch((error) => {
                          console.log(error);
                        });
```

## Changelog
#### 2.0.0
- Removed `bower` support
- Return all found packages as plain object, without formatting / writing to file 
- Added second example template for display as a table
- 

## License

MIT © [Sebastian Roming](https://webmonkey.io)

## Credits
This is originally based on [ux-license-report](https://github.com/Banno/ux-license-report).
