/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-not-to-application',
      severity: 'error',
      comment:
        'domain must not depend on application — inward dependencies only',
      from: { path: '^src/[^/]+/domain/' },
      to: { path: '^src/[^/]+/application/' },
    },
    {
      name: 'domain-not-to-infrastructure',
      severity: 'error',
      comment: 'domain must not depend on infrastructure',
      from: { path: '^src/[^/]+/domain/' },
      to: { path: '^src/[^/]+/infrastructure/' },
    },
    {
      name: 'domain-not-to-presentation',
      severity: 'error',
      comment: 'domain must not depend on presentation',
      from: { path: '^src/[^/]+/domain/' },
      to: { path: '^src/[^/]+/presentation/' },
    },
    {
      name: 'application-not-to-infrastructure',
      severity: 'error',
      comment:
        'application must not import infrastructure — depend on ports, wire adapters in *.module.ts',
      from: { path: '^src/[^/]+/application/' },
      to: { path: '^src/[^/]+/infrastructure/' },
    },
    {
      name: 'application-not-to-presentation',
      severity: 'error',
      comment: 'application must not depend on presentation',
      from: { path: '^src/[^/]+/application/' },
      to: { path: '^src/[^/]+/presentation/' },
    },
    {
      name: 'infrastructure-not-to-presentation',
      severity: 'error',
      comment: 'infrastructure must not depend on presentation',
      from: { path: '^src/[^/]+/infrastructure/' },
      to: { path: '^src/[^/]+/presentation/' },
    },
    {
      name: 'presentation-not-to-infrastructure',
      severity: 'error',
      comment:
        'presentation must not import infrastructure — wire Drizzle adapters in *.module.ts',
      from: { path: '^src/[^/]+/presentation/' },
      to: { path: '^src/[^/]+/infrastructure/' },
    },
    {
      name: 'domain-not-to-contract',
      severity: 'error',
      comment:
        'FORBIDDEN: @repo/contract in domain — use presentation/infrastructure adapters',
      from: { path: '^src/[^/]+/domain/' },
      to: { path: '@repo/contract' },
    },
    {
      name: 'application-not-to-contract',
      severity: 'error',
      comment:
        'FORBIDDEN: @repo/contract in application — use *-command.adapter in presentation',
      from: { path: '^src/[^/]+/application/' },
      to: { path: '@repo/contract' },
    },
    {
      name: 'domain-not-to-drizzle',
      severity: 'error',
      comment: 'FORBIDDEN: drizzle-orm in domain',
      from: { path: '^src/[^/]+/domain/' },
      to: { path: 'drizzle-orm' },
    },
    {
      name: 'application-not-to-drizzle',
      severity: 'error',
      comment: 'FORBIDDEN: drizzle-orm in application',
      from: { path: '^src/[^/]+/application/' },
      to: { path: 'drizzle-orm' },
    },
    {
      name: 'presentation-not-to-drizzle',
      severity: 'error',
      comment: 'FORBIDDEN: drizzle-orm in presentation',
      from: { path: '^src/[^/]+/presentation/' },
      to: { path: 'drizzle-orm' },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.depcruise.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
