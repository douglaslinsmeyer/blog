import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgPng } from '../../lib/og';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => data.draft !== true || !import.meta.env.PROD);
  return posts.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: Awaited<ReturnType<typeof getCollection<'posts'>>>[number] };
  const dateLabel = entry.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const png = await renderOgPng({ title: entry.data.title, dateLabel });
  return new Response(png.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
