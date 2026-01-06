import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

const isProduction = process.env.NODE_ENV === 'production';
const isWatch = process.argv.includes('--watch');

// Ensure dist exists
if (!existsSync('dist')) {
    mkdirSync('dist');
}

const commonOptions = {
    bundle: true,
    format: 'iife',
    minify: isProduction,
    sourcemap: isProduction ? false : 'inline',
    target: ['safari15'],
    logLevel: 'info',
};

const entries = [
    // Content scripts (each bundles shared code)
    { in: 'src/sites/instagram/content.js', out: 'dist/instagram' },
    { in: 'src/sites/youtube/content.js', out: 'dist/youtube' },
    { in: 'src/sites/facebook/content.js', out: 'dist/facebook' },
    // Background script
    { in: 'src/background.js', out: 'dist/background' },
];

async function build() {
    try {
        // Build all entry points
        for (const entry of entries) {
            if (isWatch) {
                const ctx = await esbuild.context({
                    entryPoints: [entry.in],
                    outfile: entry.out + '.js',
                    ...commonOptions,
                });
                await ctx.watch();
            } else {
                await esbuild.build({
                    entryPoints: [entry.in],
                    outfile: entry.out + '.js',
                    ...commonOptions,
                });
            }
        }

        // Copy inject.js (must stay unbundled for page context)
        copyFileSync('src/sites/instagram/inject.js', 'dist/instagram-inject.js');

        console.log(isWatch ? '👀 Watching for changes...' : '✅ Build complete!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();