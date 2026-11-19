import { createContext, useContext } from 'react'
import type { ProfileAvatar } from '../lib/avatar'

/** The signed-in user's profile picture, so every `<Avatar me>` can show it. */
export const MeAvatarContext = createContext<ProfileAvatar>({ kind: 'initials' })

export function useMeAvatar(): ProfileAvatar {
  return useContext(MeAvatarContext)
}
