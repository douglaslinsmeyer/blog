import { renderOgPng } from '../src/lib/og.ts';
import fs from 'node:fs/promises';

const png = await renderOgPng({
  title: 'Douglas Linsmeyer',
  dateLabel: 'Personal blog',
});
await fs.writeFile('./public/og-default.png', Buffer.from(png));
console.log('Wrote public/og-default.png');
