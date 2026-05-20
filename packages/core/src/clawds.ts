/**
 * Discord asset keys for the Clawd image rotation.
 * Must match the keys uploaded under Discord Developer Portal → Rich Presence → Art Assets.
 */
export const CLAWDS = [
  'clawd',
  'clawd-book',
  'clawd-bubble',
  'clawd-cape',
  'clawd-coffee',
  'clawd-dizzy',
  'clawd-happy',
  'clawd-headphones',
  'clawd-heart',
  'clawd-kite',
  'clawd-lightbulb',
  'clawd-magnifier',
  'clawd-skateboard',
  'clawd-wand',
] as const

export type ClawdKey = (typeof CLAWDS)[number]
