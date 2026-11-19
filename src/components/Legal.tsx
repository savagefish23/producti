import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Wordmark } from './Logo'

export type LegalPage = 'privacy' | 'terms'

const UPDATED = '19 November 2026'

/** Privacy policy and terms. Written to match what the app actually does. */
export function Legal({ page }: { page: LegalPage }) {
  return (
    <div className="min-h-dvh">
      <header className="border-line bg-surface border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <Wordmark size={22} />
          <a href="#/" className="btn btn-ghost ml-auto">
            <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Back to app
          </a>
        </div>
      </header>

      <main className="animate-enter mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <nav aria-label="Legal pages" className="seg mb-8">
          <a href="#/privacy" role="tab" aria-selected={page === 'privacy'} className="seg-item">
            Privacy policy
          </a>
          <a href="#/terms" role="tab" aria-selected={page === 'terms'} className="seg-item">
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

function Privacy() {
  return (
    <Article title="Privacy policy">
      <p>
        Producti is a demo habit tracker. It has no accounts and no server-side database, so we do
        not collect, store or sell your personal information.
      </p>

      <h2>What is stored, and where</h2>
      <p>
        When you create a profile you enter your full name, a username and an email address. These,
        along with your habits, check-ins and settings, are saved in your browser's local storage on
        your device. They are never sent to us or to anyone else: Producti has no server to send them
        to. Clearing your browser data, or choosing <strong>Sign out</strong>, deletes them
        permanently.
      </p>
      <p>
        Your email address is not used for anything yet. Nothing is emailed to you, and it is not
        checked or verified.
      </p>

      <h2>Notifications</h2>
      <p>
        If you turn notifications on, your browser asks for permission and then shows a notification
        when a simulated friend reacts while Producti is in the background. These notifications are
        created on your device; there is no push service involved. You can turn them off in the app
        or in your browser settings at any time.
      </p>

      <h2>What we do not collect</h2>
      <ul>
        <li>No passwords. The app never asks for one.</li>
        <li>No analytics, advertising or tracking scripts.</li>
        <li>No cookies set by Producti.</li>
      </ul>

      <h2>Simulated friends</h2>
      <p>
        The friends, their check-ins and their replies are generated on your device. They are not
        real people, and nothing you do in the app is shared with anyone.
      </p>

      <h2>Third-party services</h2>
      <ul>
        <li>
          <strong>Vercel</strong> hosts the site. Like any web host, it may log technical request
          data such as your IP address to deliver and protect the service.
        </li>
        <li>
          <strong>Google Fonts</strong> supplies the typefaces. Your browser requests them from
          Google, which receives your IP address.
        </li>
      </ul>

      <h2>Changes</h2>
      <p>
        If the app starts storing data on a server, this policy will be updated before that change
        goes live.
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
        Your data lives only in your browser. We cannot recover it if it is lost, for example when
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
