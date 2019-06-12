'use strict';

const os = require('os');
const path = require('path');
const fs = require('mz/fs');
const { existsSync } = require('fs');
const { mkdirp } = require('mz-modules');
const runscript = require('runscript');
const resolve = require('resolve');
const debug = require('debug')('jsdoc');
const getLoadUnits = require('egg-utils').getLoadUnits;

const DOCSET_NAME = 'Egg.js';
const DOCSET_NAME_SHORT = DOCSET_NAME.replace(/\./, '');

module.exports = async function({ baseDir, target }) {
  const dashDocConfig = await getDashDocConfig({ baseDir });
  const jsdoc = resolve.sync('.bin/jsdoc', { basedir: __dirname });
  await runscript(`${jsdoc} -c ${dashDocConfig} -d ${target} -r`);
  await runscript(`tar --exclude='.DS_Store' -C ./dist -czf ./dist/${DOCSET_NAME_SHORT}.tgz ${DOCSET_NAME}.docset`);
};

class Source extends Set {
  constructor({ baseDir }) {
    super();

    this.baseDir = baseDir;

    for (const unit of getLoadUnits({ framework: path.join(this.baseDir, 'node_modules/egg') })) {
      this.add(path.join(unit.path, 'README.md'));
      this.add(path.join(unit.path, 'app'));
      this.add(path.join(unit.path, 'config'));
      this.add(path.join(unit.path, 'app.js'));
      this.add(path.join(unit.path, 'agent.js'));
      try {
        const entry = require.resolve(unit.path);
        this.add(entry);
      } catch (_) {
        // nothing
      }
    }

    this.add(path.join(this.baseDir, 'node_modules/egg/lib'));

    this.add(path.join(this.baseDir, 'node_modules/egg-core/index.js'));
    this.add(path.join(this.baseDir, 'node_modules/egg-core/lib'));
  }

  add(file) {
    if (existsSync(file)) {
      debug('add %s', file);
      super.add(file);
    }
  }
}

async function getDashDocConfig({ baseDir }) {
  const tmp = path.join(os.tmpdir(), 'dash-docset');
  await mkdirp(tmp);

  const configPath = path.join(tmp, 'jsdoc.json');
  const packagePath = path.join(tmp, 'package.json');
  await fs.writeFile(packagePath, '{"name": "dash-docset"}');

  const source = new Source({ baseDir });
  const config = {
    docset: {
      name: DOCSET_NAME,
      icon: path.join(__dirname, '../icon@2x.png'),
      enableJavascript: true,
    },
    plugins: [ 'plugins/markdown' ],
    markdown: {
      tags: [ '@example' ],
    },
    source: {
      include: [ ...source ],
      // excludePattern: 'node_modules',
    },
    opts: {
      template: path.join(__dirname, 'dash_template'),
    },
  };
  await fs.writeFile(configPath, JSON.stringify(config));
  return configPath;
}
