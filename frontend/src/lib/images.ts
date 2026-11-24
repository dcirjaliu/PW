// Stock photography (Unsplash, free to use under the Unsplash License) used where
// events have no image of their own, plus decorative shots for the landing page.

const unsplash = (id: string, w: number, h?: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=70`;

/** One photo per EventCategory (same order as the backend enum). */
const CATEGORY_PHOTOS = [
  '1470229722913-7c0e2dbbafd3', // Music – concert crowd
  '1555939594-58d7cb561ad1', // Food – grill platter
  '1460661419201-fd4cecdf8a8b', // Arts – paint brushes
  '1461896836934-ffe607ba8211', // Sports – runner on track
  '1531058020387-3be344556be6', // Tech – conference hall
  '1566737236500-c8ac43014a67', // Nightlife – club lights
  '1517457373958-b7bdd4587205', // Community – people gathered at tables
  '1503095396549-807759245b35', // Theatre – stage curtain
  '1489599849927-2ee91cede3ba', // Film – cinema seats
  '1492684223066-81342ee5ff30', // Other – confetti
];

export function categoryPhoto(category: number, width = 800) {
  const id = CATEGORY_PHOTOS[category] ?? CATEGORY_PHOTOS[CATEGORY_PHOTOS.length - 1];
  return unsplash(id, width, Math.round((width * 2) / 3));
}

export const heroPhoto = unsplash('1501281668745-f7f57925c3b4', 1200);
export const heroThumb = unsplash('1459749411175-04bf5292ceea', 400, 300);
export const bannerPhoto = unsplash('1533174072545-7a4b6ad7a6c3', 1600, 600);
