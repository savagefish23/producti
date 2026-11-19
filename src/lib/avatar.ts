/*
 * Profile pictures. Three kinds:
 *   - initials: the default, generated from the name;
 *   - built:    a cartoon avatar assembled from the parts below;
 *   - image:    a photo the user uploaded, shrunk to a small square JPEG and
 *               stored as a data URL (it never leaves the device).
 *
 * Everything here is pure data + validation, so saved avatars can be checked
 * on load like the rest of the state.
 */

export const AVATAR_PARTS = {
  background: ['#0f9f6e', '#2f6fd6', '#7a5af5', '#d9467a', '#e08a2c', '#3a4256', '#14808a', '#b4475a'],
  skin: ['#f6d7c3', '#eac3a2', '#d5a07a', '#b07a52', '#8a5a3b', '#5e3b26'],
  hair: ['none', 'short', 'long', 'curly', 'bun', 'spiky'],
  hairColor: ['#1c1c22', '#5a3a22', '#a8642d', '#e2c27a', '#c94f2b', '#9aa3b5'],
  eyes: ['dots', 'happy', 'wink', 'sleepy'],
  mouth: ['smile', 'grin', 'flat', 'open'],
  accessory: ['none', 'glasses', 'shades', 'headband'],
} as const

type Parts = typeof AVATAR_PARTS
export type BuiltAvatar = { [K in keyof Parts]: Parts[K][number] }

export type ProfileAvatar =
  | { kind: 'initials' }
  | ({ kind: 'built' } & BuiltAvatar)
  | { kind: 'image'; dataUrl: string }

export const DEFAULT_BUILT: BuiltAvatar = {
  background: '#0f9f6e',
  skin: '#eac3a2',
  hair: 'short',
  hairColor: '#1c1c22',
  eyes: 'dots',
  mouth: 'smile',
  accessory: 'none',
}

/** About 90 KB of base64: plenty for a 160px JPEG, small enough for storage. */
export const MAX_AVATAR_DATA_URL = 120_000
const DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/

export function isAvatarDataUrl(v: unknown): v is string {
  return typeof v === 'string' && v.length <= MAX_AVATAR_DATA_URL && DATA_URL.test(v)
}

function pick<K extends keyof Parts>(key: K, v: unknown): Parts[K][number] {
  const options = AVATAR_PARTS[key] as readonly string[]
  return (typeof v === 'string' && options.includes(v) ? v : DEFAULT_BUILT[key]) as Parts[K][number]
}

/** Validate an avatar loaded from storage; anything odd falls back to initials. */
export function sanitizeAvatar(v: unknown): ProfileAvatar {
  if (typeof v !== 'object' || v === null) return { kind: 'initials' }
  const a = v as Record<string, unknown>
  if (a.kind === 'image') return isAvatarDataUrl(a.dataUrl) ? { kind: 'image', dataUrl: a.dataUrl } : { kind: 'initials' }
  if (a.kind === 'built') {
    return {
      kind: 'built',
      background: pick('background', a.background),
      skin: pick('skin', a.skin),
      hair: pick('hair', a.hair),
      hairColor: pick('hairColor', a.hairColor),
      eyes: pick('eyes', a.eyes),
      mouth: pick('mouth', a.mouth),
      accessory: pick('accessory', a.accessory),
    }
  }
  return { kind: 'initials' }
}

/** A random avatar for the "Shuffle" button. `rand` returns [0, 1). */
export function randomBuilt(rand: () => number): BuiltAvatar {
  const choose = <K extends keyof Parts>(key: K) => {
    const options = AVATAR_PARTS[key]
    return options[Math.floor(rand() * options.length)] as Parts[K][number]
  }
  return {
    background: choose('background'),
    skin: choose('skin'),
    hair: choose('hair'),
    hairColor: choose('hairColor'),
    eyes: choose('eyes'),
    mouth: choose('mouth'),
    accessory: choose('accessory'),
  }
}
