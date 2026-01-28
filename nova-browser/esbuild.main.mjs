import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/main/main.ts', 'src/main/preload.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outdir: 'dist/main',
  external: ['electron', 'better-sqlite3'],
  format: 'cjs',
  sourcemap: true,
});

console.log('Main process bundled successfully!');
