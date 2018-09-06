/* eslint-disable guard-for-in, max-nested-callbacks, no-implicit-coercion, no-extra-boolean-cast */

const fs = require('fs');
const path = require('path');
const treeify = require('treeify');
const bowerJson = require('bower-json');
const _ = require('underscore');
const npmLicense = require('npm-license');
const packageLicense = require('package-license');
const ldUniq = require('lodash.uniq');

exports.init = (options, callback) => {
  const output = {};
  const completed = [];
  if (fs.existsSync('.bowerrc')) {
    try {
      options = _.extend({}, JSON.parse(fs.readFileSync('.bowerrc')), options);
    } catch (error) { }
  }
  options = _.extend({}, {directory: 'bower_components'}, options);

  if (!fs.existsSync(options.directory)) {
    callback(null, new Error('No bower components found in ' + options.directory + '. Run bower install first or check your .bowerrc file'));
    return;
  }
  const packages = fs.readdirSync(options.directory);
  packages.forEach(pkg => {
    bowerJson.find(path.resolve(options.directory, pkg), ['.bower.json', 'bower.json', 'component.json'], (error, filename) => {
      if (error) {
        console.log(error);
        return;
      }

      if (!filename) {
        output[pkg] = {licenses: 'UNKNOWN'};
        completed.push(pkg);
        return;
      }
      bowerJson.read(filename, (err, bowerData) => {
        if (!!err) {
          callback(null, err);
          return;
        }

        const moduleInfo = {licenses: []};
        if (bowerData.license) {
          moduleInfo.licenses = moduleInfo.licenses.concat(bowerData.license);
        }
        if (bowerData.repository) {
          moduleInfo.repository = bowerData.repository;
        }
        if (bowerData.homepage) {
          moduleInfo.homepage = bowerData.homepage;
        }
        if (bowerData.description) {
          moduleInfo.description = bowerData.description;
        }

        npmLicense.init({start: path.resolve(options.directory, pkg)}, npmData => {
          let npmVersion;
          if (Object.keys(npmData).length > 0) {
            npmVersion = Object.keys(npmData)[0].split('@')[1];
          }
          const version = bowerData.version || npmVersion;
          output[bowerData.name + '@' + version] = moduleInfo;

          for (const packageName in npmData) {
            if (npmData[packageName].licenses && npmData[packageName].licenses !== 'UNKNOWN') {
              moduleInfo.licenses = moduleInfo.licenses.concat(npmData[packageName].licenses);
            }
            if (npmData[packageName].repository) {
              moduleInfo.repository = npmData[packageName].repository;
            }
          }

          if (typeof moduleInfo.description === 'undefined') {
            const npmFile = path.join(path.resolve(options.directory, pkg), 'package.json');
            try {
              const npmInfo = require(npmFile);
              moduleInfo.description = npmInfo.description;
            } catch (error) { }
          }

          const licenseFromFS = packageLicense(path.resolve(options.directory, pkg));
          if (licenseFromFS) {
            moduleInfo.licenses = moduleInfo.licenses.concat(licenseFromFS);
          }

          if (moduleInfo.licenses.length === 0) {
            moduleInfo.licenses = 'UNKNOWN';
          } else {
            moduleInfo.licenses = _.filter(moduleInfo.licenses, license => {
              const iAsk = license.indexOf ? license.indexOf('*') : -1;
              return (
                iAsk === -1 ||
                _.indexOf(moduleInfo.licenses, license.substring(0, iAsk)) < 0
              );
            });

            moduleInfo.licenses = ldUniq(moduleInfo.licenses);
          }

          completed.push(pkg);
          if (completed.length === packages.length) {
            callback(output);
          }
        });
      });
    });
  });
};

exports.printTree = sorted => {
  console.log(treeify.asTree(sorted, true));
};
exports.printJson = sorted => {
  console.log(JSON.stringify(sorted, null, 2));
};
