import { getCollection, type CollectionEntry } from 'astro:content';

export type FeedItem =
  | { kind: 'post'; entry: CollectionEntry<'posts'> }
  | { kind: 'note'; entry: CollectionEntry<'notes'> };

function notDraft(entry: { data: { draft?: boolean } }): boolean {
  return entry.data.draft !== true || !import.meta.env.PROD;
}

export async function getAllPosts(): Promise<CollectionEntry<'posts'>[]> {
  const all = await getCollection('posts', notDraft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getAllNotes(): Promise<CollectionEntry<'notes'>[]> {
  const all = await getCollection('notes', notDraft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getCombinedFeed(): Promise<FeedItem[]> {
  const [posts, notes] = await Promise.all([getAllPosts(), getAllNotes()]);
  const items: FeedItem[] = [
    ...posts.map((entry) => ({ kind: 'post' as const, entry })),
    ...notes.map((entry) => ({ kind: 'note' as const, entry })),
  ];
  return items.sort((a, b) => b.entry.data.date.valueOf() - a.entry.data.date.valueOf());
}

export async function getAllTags(): Promise<Map<string, number>> {
  const [posts, notes] = await Promise.all([getAllPosts(), getAllNotes()]);
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  for (const n of notes) for (const t of (n.data.tags ?? [])) counts.set(t, (counts.get(t) ?? 0) + 1);
  return counts;
}
