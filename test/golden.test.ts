import { expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { blobatar } from '../src/lib/core/blobatar';
import type { BlobatarOptions } from '../src/lib/core/render';
import { happy, mad } from '../src/lib/core/expression';

const fixture = readFileSync(new URL('../testdata/gen2.txt', import.meta.url), 'utf8');
const section = (name: string) =>
	new Map(
		fixture
			.split(`[${name}]\n`)[1]!
			.split('\n\n')[0]!
			.split('\n')
			.filter(Boolean)
			.map((line) => [line.slice(0, line.indexOf('\t')), line.slice(line.indexOf('\t') + 1)])
	);

const SHAPES: Record<string, number> = {
	round: 0.11, organic: 0.35, boxy: 0.54, capsule: 0.65, nub: 0.745,
	cloud: 0.825, droplet: 0.888, hexagon: 0.933, sun: 0.965, triangle: 0.99
};

const MARKUP: Record<string, [string, BlobatarOptions]> = {
	...Object.fromEntries(Object.entries(SHAPES).map(([s, v]) => [`shape:${s}`, ['alain', { traits: { shape: v } }]])),
	plain: ['alain', {}],
	backdrop: ['alain', { background: 'squircle' }],
	posed: ['alain', { expression: happy }],
	tinted: ['alain', { expression: mad }],
	titled: ['alain', { title: 'Alain' }],
	sized: ['alain', { size: 64 }],
	configured: ['alain', { traits: { shape: 0.96, 'eye.ratio': 0, hue: 0.5 } }],
	astral: ['🦊', {}]
};

test('renders the golden markup exactly as upstream blobatar gen2', () => {
	const markup = section('markup');
	for (const [key, [seed, opts]] of Object.entries(MARKUP)) expect(blobatar(seed, opts)).toBe(markup.get(key)!);
});

test('hashes the default render of every golden seed to the fixture value', () => {
	const seeds = [...section('hashes')].filter(([key]) => !key.includes('\0'));
	expect(seeds.length).toBe(1000);
	for (const [seed, hash] of seeds) {
		expect(createHash('sha256').update(blobatar(seed)).digest('hex').slice(0, 16)).toBe(hash);
	}
});
