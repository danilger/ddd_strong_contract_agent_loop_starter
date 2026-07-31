// @ts-check
import eslint from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const FORBIDDEN_CONTRACT_IN_APPLICATION =
  'FORBIDDEN: @repo/contract in application — use *-command.adapter in presentation';
const FORBIDDEN_CONTRACT_IN_DOMAIN =
  'FORBIDDEN: @repo/contract in domain — keep contract on presentation/infrastructure boundary';
const FORBIDDEN_DRIZZLE_IN_PRESENTATION =
  'FORBIDDEN: drizzle-orm in presentation — use CommandBus/QueryBus and adapters';
const FORBIDDEN_INFRA_IN_PRESENTATION =
  'FORBIDDEN: direct infrastructure import in presentation — wire adapters in *.module.ts';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      // ts-rest handlers are typed as Promise-returning even when sync
      '@typescript-eslint/require-await': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    files: ['src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@repo/contract',
              message: FORBIDDEN_CONTRACT_IN_DOMAIN,
            },
          ],
          patterns: [
            {
              group: [
                '@repo/contract',
                '@repo/contract/*',
                'drizzle-orm',
                'drizzle-orm/*',
                'drizzle-kit',
                'drizzle-kit/*',
                '@libsql/client',
                '@libsql/client/*',
                '@ts-rest/*',
                '@nestjs/common',
                '@nestjs/platform-express',
                '**/application/**',
                '**/infrastructure/**',
                '**/presentation/**',
              ],
              message: FORBIDDEN_CONTRACT_IN_DOMAIN,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@repo/contract',
              message: FORBIDDEN_CONTRACT_IN_APPLICATION,
            },
          ],
          patterns: [
            {
              group: [
                '@repo/contract',
                '@repo/contract/*',
                'drizzle-orm',
                'drizzle-orm/*',
                '@libsql/client',
                '@libsql/client/*',
                '@ts-rest/*',
                '**/infrastructure/**',
                '**/presentation/**',
              ],
              message: FORBIDDEN_CONTRACT_IN_APPLICATION,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/presentation/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['drizzle-orm', 'drizzle-orm/*'],
              message: FORBIDDEN_DRIZZLE_IN_PRESENTATION,
            },
            {
              group: ['@libsql/client', '@libsql/client/*'],
              message:
                'FORBIDDEN: @libsql/client in presentation — use repository ports via bus',
            },
            {
              group: ['**/infrastructure/**'],
              message: FORBIDDEN_INFRA_IN_PRESENTATION,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: [
      'src/main.ts',
      'src/app.module.ts',
      // Nest hello scaffold until replaced by a real BC module
      'src/app.controller.ts',
      'src/app.controller.spec.ts',
      'src/app.service.ts',
      'src/**/domain/**/*.ts',
      'src/**/application/**/*.ts',
      'src/**/presentation/**/*.ts',
      'src/**/infrastructure/**/*.ts',
    ],
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      'check-file/filename-blocklist': [
        'error',
        {
          '**/use-cases/**': 'application/commands/*.command.handler.ts',
          '**/*.use-case.ts': '*.command.handler.ts',
          '**/*UseCase.ts': '*.command.handler.ts',
          '**/*.service.ts': '*.command.handler.ts',
        },
        {
          errorMessage:
            'FORBIDDEN: "{{ target }}" — use CQRS *.command.handler.ts / *.query.handler.ts, not use cases or services',
        },
      ],
    },
  },
);
