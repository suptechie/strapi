module.exports = {
  parser: 'babel-eslint',
  extends: [
    'airbnb',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:redux-saga/recommended',
    'prettier',
  ],
  plugins: ['react', 'redux-saga', 'react-hooks', 'import', 'jsx-a11y'],
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    mocha: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: 'module',
  },
  globals: {
    strapi: false,
    window: false,
    cy: false,
    Cypress: false,
    expect: false,
    assert: false,
    chai: false,
    // TODO: put all this in process.env in webpack to avoid having to set them here
    REMOTE_URL: true,
    BACKEND_URL: true,
    PUBLIC_PATH: true,
    MODE: true,
    NODE_ENV: true,
  },
  settings: {
    react: {
      version: '16.5.2',
    },
  },
  rules: {
    'import/no-unresolved': 0,
    'generator-star-spacing': 0,
    'no-console': 0,
    'require-atomic-updates': 0,
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'arrow-body-style': 0,
    'arrow-parens': 0,
    camelcase: 0,
    'comma-dangle': 0,
    'consistent-return': [
      2,
      {
        treatUndefinedAsUnspecified: true,
      },
    ],
    'template-curly-spacing': 0,
    'func-names': ['error', 'never'],
    'function-paren-newline': 0,
    'implicit-arrow-linebreak': 0,
    'import/no-extraneous-dependencies': 0,
    'import/no-named-as-default': 0,
    'import/order': 2,
    'jsx-a11y/click-events-have-key-events': 1,
    'max-len': [
      2,
      {
        code: 120,
        ignoreComments: true,
        ignoreUrls: true,
        ignoreTrailingComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
    'newline-before-return': 2,
    'no-confusing-arrow': 0,
    'no-else-return': 1,
    'no-nested-ternary': ['error'],
    'no-return-assign': 0,
    'no-param-reassign': 0,
    'no-plusplus': 0,
    'no-shadow': 0,
    'no-underscore-dangle': 0,
    'no-use-before-define': ['error', { functions: false, classes: false, variables: false }],
    'object-curly-newline': [2, { multiline: true, consistent: true }],
    'operator-linebreak': 0,
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'if' },
      { blankLine: 'any', prev: 'block-like', next: 'if' },
    ],
    'prefer-arrow-callback': 0,
    'prefer-const': 0,
    'prefer-destructuring': 0,
    'prefer-object-spread': 0,
    'prefer-spread': 0,
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
    'react/destructuring-assignment': 0,
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'react/forbid-prop-types': 0,
    'react/no-unused-prop-types': 2,
    'react/jsx-props-no-spreading': 0,
    'react/jsx-one-expression-per-line': 0,
    'react/state-in-constructor': 0,
    'react/static-property-placement': 0,
    'react/display-name': 0,
  },
};
