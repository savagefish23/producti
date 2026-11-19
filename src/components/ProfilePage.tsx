import { ImageUp, Shuffle, Sparkles, Type } from 'lucide-react'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  AVATAR_PARTS,
  DEFAULT_BUILT,
  isAvatarDataUrl,
  MAX_AVATAR_DATA_URL,
  randomBuilt,
  type BuiltAvatar,
  type ProfileAvatar,
} from '../lib/avatar'
import type { RankInfo } from '../lib/game'
import { PROFILE_LIMITS, validateSignIn, type FieldErrors } from '../lib/profile'
import type { AppState } from '../types'
import { Avatar } from './Avatar'
import { AvatarArt } from './AvatarArt'
import { PageHeader } from './Overview'
import { RankEmblem } from './RankEmblem'
import { formatNumber } from './styles'

interface Props {
  profile: AppState['profile']
  rank: RankInfo
  xp: number
  bestStreak: number
  checkins: number
  onSave: (fields: { fullName: string; username: string; email: string }) => void
  onAvatar: (avatar: ProfileAvatar) => void
}

type Mode = ProfileAvatar['kind']

const PART_LABELS: Record<keyof BuiltAvatar, string> = {
  background: 'Background',
  skin: 'Skin',
  hair: 'Hair',
  hairColor: 'Hair colour',
  eyes: 'Eyes',
  mouth: 'Mouth',
  accessory: 'Extra',
}

const COLOUR_PARTS = new Set<keyof BuiltAvatar>(['background', 'skin', 'hairColor'])

/** Shrink an uploaded photo to a 160px square JPEG data URL, on the device. */
async function photoToDataUrl(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Choose a JPG, PNG or WebP image')
  if (file.size > 10 * 1024 * 1024) throw new Error('That image is over 10 MB')
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 160
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not read that image')
  // Centre crop to a square, then scale down.
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 160, 160)
  bitmap.close()
  for (const quality of [0.85, 0.7, 0.55]) {
    const url = canvas.toDataURL('image/jpeg', quality)
    if (url.length <= MAX_AVATAR_DATA_URL && isAvatarDataUrl(url)) return url
  }
  throw new Error('Could not shrink that image enough')
}

export function ProfilePage({ profile, rank, xp, bestStreak, checkins, onSave, onAvatar }: Props) {
  return (
    <div className="space-y-8">
      <PageHeader title="Profile" subtitle="How you appear in Producti" />

      <section className="card relative overflow-hidden p-6">
        <div className="flex flex-wrap items-center gap-6">
          <Avatar name={profile.name} me size="xl" className="ring-surface ring-4" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-semibold tracking-[-0.02em]">{profile.name}</h2>
            <p className="mono text-ink-2 text-sm">@{profile.username}</p>
            <div className="mt-4 grid max-w-md grid-cols-3 gap-3">
              <Mini label="Total XP" value={formatNumber(xp)} />
              <Mini label="Best streak" value={`${bestStreak}d`} />
              <Mini label="Check-ins" value={formatNumber(checkins)} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <RankEmblem rank={rank} size={88} />
            <span className="text-sm font-semibold">{rank.name}</span>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <AvatarEditor name={profile.name} current={profile.avatar} onAvatar={onAvatar} />
        <DetailsForm profile={profile} onSave={onSave} />
      </div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-raised rounded-lg px-3 py-2">
      <p className="text-muted text-[11px]">{label}</p>
      <p className="mono text-base font-medium">{value}</p>
    </div>
  )
}

function AvatarEditor({ name, current, onAvatar }: { name: string; current: ProfileAvatar; onAvatar: (a: ProfileAvatar) => void }) {
  const [mode, setMode] = useState<Mode>(current.kind)
  const [built, setBuilt] = useState<BuiltAvatar>(current.kind === 'built' ? current : DEFAULT_BUILT)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const preview: ProfileAvatar =
    mode === 'built' ? { kind: 'built', ...built } : mode === 'image' && current.kind === 'image' ? current : { kind: 'initials' }

  const chooseFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      onAvatar({ kind: 'image', dataUrl: await photoToDataUrl(file) })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not use that image')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const tab = (value: Mode, label: string, icon: ReactNode) => (
    <button type="button" role="tab" aria-selected={mode === value} onClick={() => setMode(value)} className="seg-item flex-1 justify-center">
      {icon}
      {label}
    </button>
  )

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="avatar-title">
      <h2 id="avatar-title" className="text-base font-semibold">
        Profile picture
      </h2>
      <p className="text-ink-2 text-[13px]">Upload a photo or build an avatar. It stays on this device.</p>

      <div role="tablist" aria-label="Picture type" className="seg mt-4 flex w-full">
        {tab('built', 'Create', <Sparkles className="size-4" strokeWidth={1.75} aria-hidden="true" />)}
        {tab('image', 'Upload', <ImageUp className="size-4" strokeWidth={1.75} aria-hidden="true" />)}
        {tab('initials', 'Initials', <Type className="size-4" strokeWidth={1.75} aria-hidden="true" />)}
      </div>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-3">
          <Avatar name={name} avatar={preview} size="xl" />
          {mode === 'built' && (
            <button type="button" onClick={() => setBuilt(randomBuilt(Math.random))} className="btn btn-sm btn-ghost">
              <Shuffle className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Shuffle
            </button>
          )}
        </div>

        <div className="w-full min-w-0 flex-1">
          {mode === 'built' && (
            <div className="space-y-4">
              {(Object.keys(AVATAR_PARTS) as (keyof BuiltAvatar)[]).map((part) => (
                <fieldset key={part}>
                  <legend className="text-ink-2 mb-1.5 text-xs">{PART_LABELS[part]}</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {(AVATAR_PARTS[part] as readonly string[]).map((option) => {
                      const active = built[part] === option
                      const colour = COLOUR_PARTS.has(part)
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={active}
                          aria-label={`${PART_LABELS[part]}: ${colour ? option : option}`}
                          onClick={() => setBuilt((prev) => ({ ...prev, [part]: option }) as BuiltAvatar)}
                          className={`focus-ring flex items-center justify-center rounded-lg transition-colors duration-150 ${
                            colour ? 'size-8' : 'size-10'
                          } ${active ? 'ring-accent ring-2 ring-offset-2 ring-offset-(--surface)' : 'hover:bg-raised'}`}
                        >
                          {colour ? (
                            <span className="size-6 rounded-full" style={{ background: option }} />
                          ) : (
                            <AvatarArt avatar={{ ...built, [part]: option } as BuiltAvatar} className="size-9 rounded-full" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              ))}
              <button type="button" onClick={() => onAvatar({ kind: 'built', ...built })} className="btn btn-primary">
                Use this avatar
              </button>
            </div>
          )}

          {mode === 'image' && (
            <div className="space-y-3">
              <label
                className="border-line-strong hover:bg-raised flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors duration-150"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  void chooseFile(e.dataTransfer.files[0])
                }}
              >
                <ImageUp className="text-muted size-6" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-sm font-medium">{busy ? 'Processing…' : 'Choose a photo or drop it here'}</span>
                <span className="text-muted text-xs">JPG, PNG or WebP, up to 10 MB. It is cropped to a square and shrunk.</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => void chooseFile(e.target.files?.[0])}
                />
              </label>
              {error && (
                <p role="alert" className="text-negative text-[13px]">
                  {error}
                </p>
              )}
            </div>
          )}

          {mode === 'initials' && (
            <div className="space-y-3">
              <p className="text-ink-2 text-sm">Show your initials on a plain circle.</p>
              <button type="button" onClick={() => onAvatar({ kind: 'initials' })} className="btn btn-primary">
                Use initials
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function DetailsForm({ profile, onSave }: { profile: AppState['profile']; onSave: Props['onSave'] }) {
  const [fullName, setFullName] = useState(profile.name)
  const [username, setUsername] = useState(profile.username)
  const [email, setEmail] = useState(profile.email)
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved] = useState(false)
  const fields = { fullName, username, email, notifications: false }
  const errors: FieldErrors = submitted ? validateSignIn(fields) : {}

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(validateSignIn(fields)).length > 0) return
    onSave({ fullName, username, email })
    setSaved(true)
  }

  const input = (invalid: boolean) =>
    `bg-surface mt-1.5 h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 ${
      invalid ? 'border-negative' : 'border-line-strong focus:border-accent focus:ring-(--accent-soft)'
    }`

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="details-title">
      <h2 id="details-title" className="text-base font-semibold">
        Details
      </h2>
      <form onSubmit={submit} noValidate className="mt-4 space-y-4" onChange={() => setSaved(false)}>
        <label className="block text-sm font-medium">
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={PROFILE_LIMITS.fullName} autoComplete="name" aria-invalid={!!errors.fullName} className={input(!!errors.fullName)} />
          {errors.fullName && <span role="alert" className="text-negative mt-1 block text-[13px] font-normal">{errors.fullName}</span>}
        </label>
        <label className="block text-sm font-medium">
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value.replace(/^@+/, ''))} maxLength={PROFILE_LIMITS.username} autoCapitalize="none" spellCheck={false} aria-invalid={!!errors.username} className={input(!!errors.username)} />
          {errors.username && <span role="alert" className="text-negative mt-1 block text-[13px] font-normal">{errors.username}</span>}
        </label>
        <label className="block text-sm font-medium">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={PROFILE_LIMITS.email} autoCapitalize="none" spellCheck={false} aria-invalid={!!errors.email} className={input(!!errors.email)} />
          {errors.email && <span role="alert" className="text-negative mt-1 block text-[13px] font-normal">{errors.email}</span>}
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
          {saved && <span className="text-accent-text text-[13px]" role="status">Saved</span>}
        </div>
        <p className="text-muted text-xs">Stored only in this browser.</p>
      </form>
    </section>
  )
}
