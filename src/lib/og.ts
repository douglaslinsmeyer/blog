import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs/promises';
import path from 'node:path';

// Load Source Serif 4 static TTF fonts once at module init (Node only — runs at build time).
// satori does not support woff2 or variable fonts; use static TTF variants instead.
const fontRegularPath = path.resolve('./public/fonts/source-serif-4-regular.ttf');
const fontBoldPath = path.resolve('./public/fonts/source-serif-4-bold.ttf');

let fontsPromise: Promise<[Buffer, Buffer]> | null = null;
function loadFonts(): Promise<[Buffer, Buffer]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fs.readFile(fontRegularPath),
      fs.readFile(fontBoldPath),
    ]);
  }
  return fontsPromise;
}

export interface OgInput {
  title: string;
  dateLabel: string;
}

export async function renderOgPng({ title, dateLabel }: OgInput): Promise<Buffer> {
  const [fontRegular, fontBold] = await loadFonts();

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: '#fafaf7',
          color: '#1a1a1a',
          fontFamily: 'Source Serif 4',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontSize: '24px',
                color: '#666666',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              },
              children: dateLabel,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: '72px',
                fontWeight: 700,
                lineHeight: 1.15,
                maxWidth: '1040px',
              },
              children: title,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: '24px',
                color: '#8b2c2c',
                fontWeight: 500,
              },
              children: 'douglaslinsmeyer.com',
            },
          },
        ],
      },
    } as any,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Source Serif 4',
          data: fontRegular,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Source Serif 4',
          data: fontBold,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return Buffer.from(png);
}
