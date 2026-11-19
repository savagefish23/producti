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
        <li>If you create an account, your profile and habits are stored securely so they sync between devices.</li>
        <li>Your email is used only to sign you in and to reset your password. Other users never see it.</li>
        <li>We do not sell or share your personal information, and there are no ads, analytics or tracking.</li>
        <li>You can delete your account and all its data at any time, from your profile.</li>
      </ul>

      <h2>Who we are</h2>
      <p>
        Producti is an independent project. For any question about this policy or your data, contact us
        through the project's{' '}
        <a href={CONTACT_URL} className="text-accent-text underline underline-offset-2">
          public issue tracker on GitHub
        </a>
        .
      </p>

      <h2>Information we collect</h2>
      <p>When you create an account:</p>
      <ul>
        <li>your email address and a password (the password is stored only as a secure hash; we never see it);</li>
        <li>your full name and a username.</li>
      </ul>
      <p>When you use the app:</p>
      <ul>
        <li>your habits, check-ins, streaks, status and settings;</li>
        <li>
          optionally, a profile picture: an avatar you build in the app, or a photo you upload, which is
          cropped and shrunk on your device before it is saved.
        </li>
      </ul>

      <h2>How it is used</h2>
      <ul>
        <li>To run your account: signing in, keeping your data in sync and resetting your password.</li>
        <li>To show your habits, streaks, XP, rank and stats.</li>
        <li>
          Your full name and username may be visible to other signed-in users so friends can find you. Your
          email, habits and history are not.
        </li>
      </ul>
      <p>We do not use your information for advertising or profiling, and we do not sell it.</p>

      <h2>Where it is stored</h2>
      <p>
        Accounts and synced data are stored with <strong>Supabase</strong>, our database and
        authentication provider. Database rules ensure each user can read and change only their own data.
        A copy is also kept in your browser so the app works offline.
      </p>
      <p>
        If you use <strong>Explore with sample data</strong> without an account, everything stays in your
        browser only and is never sent to us.
      </p>

      <h2>Emails we send</h2>
      <p>
        Only account emails, sent by Supabase: a link to confirm your address when you sign up, and a link
        to reset your password when you ask for one. No newsletters or marketing.
      </p>

      <h2>Notifications</h2>
      <p>
        If you turn notifications on, your browser or phone asks for permission and then shows a
        notification when a friend reacts while Producti is in the background. They are created on your
        device; no push service is used. You can turn them off in the app or your device settings.
      </p>

      <h2>Sharing and service providers</h2>
      <ul>
        <li>
          <strong>Supabase</strong> stores account data and sends account emails on our behalf.
        </li>
        <li>
          <strong>Vercel</strong> hosts the app and may log technical request data, such as your IP address,
          to deliver and protect the service.
        </li>
        <li>
          <strong>Google Fonts</strong> supplies the typefaces; your browser requests them from Google, which
          receives your IP address.
        </li>
      </ul>
      <p>We share information with no one else, except where the law requires it. Producti sets no tracking cookies.</p>

      <h2>Keeping and deleting your data</h2>
      <p>
        We keep your account data until you delete it. To delete your account and everything in it, go to{' '}
        <strong>Profile → Delete account</strong>. Deletion is immediate and permanent. Signing out removes
        the copy stored in your browser.
      </p>

      <h2>Children</h2>
      <p>
        Producti is not directed at children under 13, and we do not knowingly collect information from them.
        If you believe a child has created an account, contact us and we will delete it.
      </p>

      <h2>Security</h2>
      <p>
        The app is served over HTTPS with a strict Content Security Policy. Passwords are hashed, sign-in
        attempts and account emails are rate-limited, and every database table uses row-level security so
        users can access only their own data. No method of storage is perfectly secure, so please use a
        strong, unique password.
      </p>

      <h2>Your rights</h2>
      <p>
        You can view and edit your profile in the app, delete your account at any time, and contact us to
        ask what we hold about you.
      </p>

      <h2>Changes to this policy</h2>
      <p>If this policy changes, the date at the top will change, and significant changes will be shown in the app.</p>
    </Article>
  )
}

function Terms() {
  return (
    <Article title="Terms of use">
      <p>
        By using Producti you agree to these terms. If you do not agree, please do not use the app.
      </p>

      <h2>The service</h2>
      <p>
        Producti is an independent project, provided free of charge and as is, without warranties of any
        kind. Features may change or stop working at any time.
      </p>

      <h2>Your account</h2>
      <p>
        You need to be at least 13 to create an account. Keep your password safe; you are responsible for
        activity on your account. Choose a username that doesn't impersonate anyone or offend others; we may
        remove accounts that do. You can delete your account at any time from your profile.
      </p>

      <h2>Your data</h2>
      <p>
        Your habits and history belong to you. How we handle them is described in the privacy policy. The
        sample-data demo lives only in your browser and cannot be recovered if browser storage is cleared.
      </p>

      <h2>Not advice</h2>
      <p>
        Producti helps you keep track of habits. It is not medical, fitness or health advice. Talk to
        a qualified professional before starting a new exercise or health routine.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not try to disrupt the service, get around its security, access other people's accounts or data,
        or automate sign-ups.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, the author is not liable for any loss arising from use of the
        app, including loss of data.
      </p>
    </Article>
  )
}
