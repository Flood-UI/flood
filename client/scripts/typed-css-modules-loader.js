const chalk = require('chalk');
const DtsCreator = require('typed-css-modules');

const creator = new DtsCreator();

module.exports = function moduleLoader(source, map) {
  if (this.cacheable) {
    this.cacheable();
  }

  const callback = this.async();

  creator
    .create(this.resourcePath, source)
    .then(content =>
      content.writeFile().then(() => {
        callback(null, source, map);
      }),
    )
    .catch(error => {
      console.log('\n');
      console.log(chalk.bold(chalk.red('CSS module type generation failed.')));
      console.log(error.message);

      if (error.stack != null) {
        console.log(chalk.gray(error.stack));
      }
    });
};
