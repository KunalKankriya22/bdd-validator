const { createCjsPreset } = require('jest-preset-angular/presets');

const presetConfig = createCjsPreset();

/** @type {import('jest').Config} */
module.exports = {
  ...presetConfig,

  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  testMatch: ['<rootDir>/src/**/*.spec.ts'],

  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1',
    '^@components/(.*)$': '<rootDir>/src/app/components/$1',
    '^@services/(.*)$': '<rootDir>/src/app/services/$1',
    '^@state/(.*)$': '<rootDir>/src/app/state/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },

  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@angular|@okta|@codemirror)',
  ],

  collectCoverage: false,
  coverageDirectory: './coverage',
  coverageReporters: ['html', 'text-summary', 'cobertura', 'lcov', 'json-summary'],

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '\\.spec\\.ts$',
    '\\.model\\.ts$',
    '\\.models\\.ts$',
    '\\.interface\\.ts$',
    '\\.interfaces\\.ts$',
    '\\.routes\\.ts$',
    '/environments/',
    '/index\\.ts$',
    'src/main\\.ts$',
    'src/app/app\\.config\\.ts$',
    'jasmine-compat\\.ts$',
    'jasmine-compat\\.d\\.ts$',
    'codabar-scheme\\.enum\\.ts$',
    '/core/constants/route-registry\\.ts$',
    '/core/constants/ui\\.constants\\.ts$',
    '/core/constants/timezone\\.constants\\.ts$',
    '/core/constants/validation\\.constants\\.ts$',
    '/core/constants/route-keys\\.ts$',
    '/core/constants/http-context\\.constants\\.ts$',
    'component-delete-error-codes\\.constants\\.ts$',
    'prdtyat\\.constants\\.ts$',
    'error-messages\\.constants\\.ts$',
    'user-form\\.config\\.ts$',
    '/core/constants/api\\.constants\\.ts$',
    '\\.enum\\.ts$',
    '\\.module\\.ts$',
  ],


  maxWorkers: '50%',
  workerIdleMemoryLimit: '512MB',

  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'unit-test-results.xml',
      },
    ],
  ],
};
