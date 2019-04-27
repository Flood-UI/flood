const path = require('path');

module.exports = {
  extends: ['prettier', 'airbnb', 'plugin:import/errors', 'plugin:import/warnings'],
  parser: 'babel-eslint',
  plugins: ['flowtype', 'import'],
  rules: {
    'arrow-parens': 0,
    'implicit-arrow-linebreak': 0,
    'import/no-extraneous-dependencies': 0,
    'import/prefer-default-export': 0,
    'max-len': ['error', {code: 120}],
    'object-curly-newline': 0,
    'object-curly-spacing': 0,
    'react/button-has-type': 0,
    'react/destructuring-assignment': 0,
    'react/no-unescaped-entities': ['error', {forbid: ['>', '}']}],
    'react/jsx-filename-extension': [1, {extensions: ['.js']}],
    'react/jsx-one-expression-per-line': 0,
    'react/prefer-stateless-function': 0,
    'react/require-default-props': 0,
  },
};
