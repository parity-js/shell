module.exports = {
  'presets': [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-flow'
  ],
  'plugins': [
    [
      '@babel/plugin-proposal-decorators',
      {
        'legacy': true
      }
    ],
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-transform-modules-commonjs',
    '@babel/plugin-transform-runtime',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-syntax-import-meta',
    [
      '@babel/plugin-proposal-class-properties',
      {
        'loose': true
      }
    ],
    '@babel/plugin-proposal-json-strings',
    '@babel/plugin-proposal-function-sent',
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-proposal-numeric-separator',
    '@babel/plugin-proposal-throw-expressions',
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-logical-assignment-operators',
    '@babel/plugin-proposal-optional-chaining',
    [
      '@babel/plugin-proposal-pipeline-operator',
      {
        'proposal': 'minimal'
      }
    ],
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-do-expressions',
    '@babel/plugin-proposal-function-bind'
  ],
  'retainLines': true,
  'env': {
    'production': {
      'plugins': [
        'transform-react-remove-prop-types'
      ]
    },
    'development': {
      'plugins': [
        [
          'react-intl',
          {
            'messagesDir': './.build/i18n/'
          }
        ],
        'react-hot-loader/babel'
      ]
    },
    'test': {}
  }
};
