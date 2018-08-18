'use strict';
const chalk = require('chalk');

const enforcePrerequisites = require('./enforce-prerequisites');
const {startWebServer} = require('./web-server');

enforcePrerequisites().then(startWebServer).catch((error) => {
  console.log(chalk.red('Failed to start web server:'));
  console.trace(error);

  process.exit(1);
});
