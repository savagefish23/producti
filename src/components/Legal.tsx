import { ArrowLeft } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Wordmark } from './Logo'

export type LegalPage = 'privacy' | 'terms'

const UPDATED = '19 November 2026'

/** Privacy policy and terms. Written to match what the app actually does. */
export function Legal({ page }: { page: LegalPage }) {
  useEffect(() => {
    const previous = document.title
    document.title = page === 'privacy' ? 'Privacy policy — Producti' : 'Terms of use — Producti'
    return () => {
      document.title = previous
    }
  }, [page])

  return (
    <div className="min-h-dvh">
      <header className="border-line bg-surface border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <Wordmark size={22} />
          <a href="/" className="btn btn-ghost ml-auto">
            <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Back to app
          </a>
        </div>
      </header>

      <main className="animate-enter mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <nav aria-label="Legal pages" className="seg mb-8">
          <a href="/privacy" role="tab" aria-selected={page === 'privacy'} className="seg-item">
            Privacy policy
          </a>
          <a href="/terms" role="tab" aria-selected={page === 'terms'} className="seg-item">
            Terms of use
          </a>
        </nav>
        {page === 'privacy' ? <Privacy /> : <Terms />}
      </main>
    </div>
  )
}

function Article({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="text-ink-2 space-y-4 text-[15px] leading-7 [&_h2]:text-ink [&_h2]:pt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_strong]:text-ink [&_strong]:font-medium [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
      <h1 className="text-ink text-[28px] leading-tight font-semibold">{title}</h1>
      <p className="mono text-muted text-xs">Last updated {UPDATED}</p>
      {children}
    </article>
  )
}

const CONTACT_URL = 'https://github.com/savagefish23/producti/issues'

function Privacy() {
  return (
    <Article title="Privacy policy">
      <p>
        This policy explains how Producti, a habit tracker available at getproducti.vercel.app and as
        an installable app, handles your information.
      </p>

      <h2>Summary</h2>
      <ul>
        <li>Producti has no server-side database and no accounts on a server.</li>
        <li>Everything you enter is stored only on your own device.</li>
        <li>We do not collect, sell or share your personal information.</li>
        <li>There are no ads, analytics or tracking.</li>
      </ul>

      <h2>Who we are</h2>
      <p>
        Producti is an independent project. For any question about this policy or your data, contact
        us through the project's{' '}
        <a href={CONTACT_URL} className="text-accent-text underline underline-offset-2">
          public issue tracker on GitHub
        </a>
        .
      </p>

      <h2>Information you enter</h2>
      <p>When you create a profile and use the app, you enter:</p>
      <ul>
        <li>your full name, a username and an email address;</li>
        <li>
          optionally, a profile picture: either an avatar you build in the app, or a photo you upload,
          which is cropped and shrunk on your device before it is saved;
        </li>
        <li>your habits, check-ins and status;</li>
        <li>settings such as light or dark mode and whether notifications are on.</li>
      </ul>
      <p>
        No password is ever asked for. Your email address is not used for anything: nothing is emailed
        to you, and it is not checked or verified.
      </p>

      <h2>Where it is stored</h2>
      <p>
        All of this is saved in your browser's local storage on your device. It is never sent to us or
        to anyone else, because Producti has no server to send it to. We cannot see, access or recover
        it.
      </p>

      <h2>How it is used</h2>
      <p>
        Your information is used only on your device, to show your habits, streaks, XP, rank and stats.
        It is not used for advertising or profiling.
      </p>

      <h2>Sharing</h2>
      <p>
        We do not share your information with anyone. The friends shown in the app are simulated on
        your device; they are not real people, and nothing you do is shared with them or with others.
      </p>

      <h2>Notifications</h2>
      <p>
        If you turn notifications on, your browser or phone asks for permission and then shows a
        notification when a simulated friend reacts while Producti is in the background. These
        notifications are created on your device; no push service is used. You can turn them off in the
        app or in your device settings at any time.
      </p>

      <h2>Third-party services</h2>
      <ul>
        <li>
          <strong>Vercel</strong> hosts the app. Like any web host, it may log technical request data
          such as your IP address to deliver and protect the service.
        </li>
        <li>
          <strong>Google Fonts</strong> supplies the typefaces. Your browser requests them from Google,
          which receives your IP address.
        </li>
      </ul>
      <p>Producti sets no cookies.</p>

      <h2>Keeping and deleting your data</h2>
      <p>
        Your data stays on your device until you delete it. To delete everything, choose{' '}
        <strong>Sign out</strong> in the app, or clear the site data for Producti in your browser or
        uninstall the app. Deletion is immediate and permanent.
      </p>

      <h2>Children</h2>
      <p>
        Producti is not directed at children under 13, and we do not knowingly collect information from
        them. Because no information leaves your device, none is held by us.
      </p>

      <h2>Security</h2>
      <p>
        The app is served over HTTPS with a strict Content Security Policy, and data loaded from storage
        is validated before use. Anyone with access to your device or browser could read what is stored
        there, so use your device's own lock and protection.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If Producti starts storing information on a server, for example to offer real accounts, this
        policy will be updated before that change goes live, and the date at the top will change.
      </p>
    </Article>
  )
}

function Terms() {
  return (
    <Article title="Terms of use">
      <p>
        By using Producti you agree to these terms. If you do not agree, please do not use the app.
      </p>

      <h2>A demo, provided as is</h2>
      <p>
        Producti is a portfolio project. It is provided free of charge, as is, without warranties of
        any kind. Features may change or stop working at any time.
      </p>

      <h2>Your data</h2>
      <p>
        Your data lives only on your device. We cannot recover it if it is lost, for example when
        browser storage is cleared. You are responsible for anything you enter into the app.
      </p>

      <h2>Not advice</h2>
      <p>
        Producti helps you keep track of habits. It is not medical, fitness or health advice. Talk to
        a qualified professional before starting a new exercise or health routine.
      </p>

      <h2>Acceptable use</h2>
      <p>Do not try to disrupt the site, its hosting, or other people's use of it.</p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, the author is not liable for any loss arising from use of the
        app, including loss of data.
      </p>
    </Article>
  )
}
