// If you add a network call, a storage key, analytics, or a device permission,
// update this page AND the Play Console "Data safety" form to match.
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { PageTransition } from '@/components/common/PageTransition'

const UPDATED = '15 November 2026'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-2 text-title">{title}</h2>
      <div className="space-y-3 text-[15px] leading-6 text-fg-muted">{children}</div>
    </section>
  )
}

// Drops the service worker and its caches only — groups and expenses in
// localStorage are untouched.
async function clearCacheAndReload() {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations() ?? []
    await Promise.all(regs.map((r) => r.unregister()))
    const keys = await caches?.keys() ?? []
    await Promise.all(keys.map((k) => caches.delete(k)))
  } finally {
    location.reload()
  }
}

export default function AboutPage() {
  const [clearing, setClearing] = useState(false)

  return (
    <AppShell>
      <TopBar title="About & privacy" showBack largeTitle />
      <PageTransition>
        <article className="mx-auto max-w-[640px] px-4 pt-4 pb-12 md:py-10">
          <h1 className="text-title-lg">About & privacy</h1>
          <p className="mt-1 text-body-sm text-fg-subtle">Last updated {UPDATED}</p>

          <Section title="The short version">
            <p>SplitItt has no accounts and no backend that stores your data. Everything you enter stays on this device. We don't collect, sell or share any of your data, and there are no ads or analytics.</p>
          </Section>

          <Section title="What's stored, and where">
            <p>Your groups, member names, UPI IDs, expenses, receipt photos, payments, templates and theme choice are saved in your browser's local storage on this device only. They are never uploaded.</p>
            <p>Uninstalling the app may not remove this data. To delete it, delete your groups in the app or clear site data for this website in your browser settings. Clearing site data erases your groups for good, so export a JSON backup first if you want to keep them.</p>
          </Section>

          <Section title="Network requests">
            <p>The app only connects to the internet to load the app itself from this website. Fonts and icons are bundled with the app, so nothing is requested from Google or any other third party.</p>
            <p>None of your expense data is included in that request.</p>
          </Section>

          <Section title="Sharing and payments">
            <p>When you tap Pay, Share or WhatsApp, SplitItt passes the amount, name and UPI ID to the UPI app, WhatsApp or share target you choose. What happens after that is covered by that app's privacy policy. SplitItt never processes payments.</p>
          </Section>

          <Section title="Children">
            <p>SplitItt isn't aimed at children and doesn't knowingly collect anything from anyone.</p>
          </Section>

          <Section title="Contact">
            <p>
              Questions or problems:{' '}
              <a className="font-medium text-fg underline underline-offset-4" href="https://github.com/bhavy67/expense-splitter/issues" target="_blank" rel="noreferrer">
                open an issue on GitHub
              </a>.
            </p>
          </Section>

          <Section title="Troubleshooting">
            <p>App stuck on an old version or acting strangely? This clears the app's cached files and reloads. Your groups and expenses are kept.</p>
            <Button
              variant="secondary"
              className="mt-2"
              loading={clearing}
              onClick={() => { setClearing(true); clearCacheAndReload() }}
            >
              <RefreshCw className="size-4" />
              Clear cache & reload
            </Button>
          </Section>
        </article>
      </PageTransition>
    </AppShell>
  )
}
