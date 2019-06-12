'use strict';

const Zlogger = require('zlogger');
const { existsSync } = require('fs');
const { rimraf } = require('mz-modules');
const path = require('path');

const jsdoc = require('./jsdoc');
const logger = new Zlogger({
  time: false,
});

const main = async function() {
  const baseDir = process.cwd();
  const targetDir = path.join(baseDir, 'dist');

  if (existsSync(targetDir)) {
    logger.info('Delete exist files');
    await rimraf(targetDir);
  }

  logger.info('Build API document');
  await jsdoc({ baseDir, target: targetDir });
};

main()
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });
