// If you add a network call, a storage key, analytics, or a device permission,
// update this page AND the Play Console "Data safety" form to match.
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'

const UPDATED = '21 October 2026'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-black uppercase tracking-[0.08em] text-[#0a0a0a] dark:text-[#f0ede5] mb-2">{title}</h2>
      <div className="text-sm leading-relaxed text-[#4a4940] dark:text-[#c8bfb0] space-y-2">{children}</div>
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
      <TopBar title="About & Privacy" showBack />
      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
          <h1 className="text-xl font-black uppercase tracking-[0.04em] text-[#0a0a0a] dark:text-[#f0ede5]">About & Privacy</h1>
          <p className="text-xs font-medium text-[#4a4940] dark:text-[#a09880] mt-0.5">Last updated {UPDATED}</p>

          <Section title="The short version">
            <p>SplitItt has no accounts and no backend that stores your data. Everything you enter stays on this device. We don't collect, sell or share any of your data, and there are no ads or analytics.</p>
          </Section>

          <Section title="What's stored, and where">
            <p>Your groups, member names, UPI IDs, expenses, receipt photos, payments, templates and theme choice are saved in your browser's local storage on this device only. They are never uploaded.</p>
            <p>Uninstalling the app may not remove this data. To delete it, delete your groups in the app or clear site data for this website in your browser settings. Clearing site data erases your groups for good, so export a JSON backup first if you want to keep them.</p>
          </Section>

          <Section title="Network requests">
            <p>The app only connects to the internet to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>load the app itself from this website, and</li>
              <li>load the DM Sans and DM Mono fonts from Google Fonts (fonts.googleapis.com, fonts.gstatic.com). Google receives your IP address and browser details, as with any website visit. See Google's privacy policy.</li>
            </ul>
            <p>None of your expense data is included in these requests.</p>
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
              <a className="underline font-bold text-[#0a0a0a] dark:text-[#b9f542]" href="https://github.com/bhavy67/expense-splitter/issues" target="_blank" rel="noreferrer">
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
              <RefreshCw className="w-4 h-4" />
              Clear cache & reload
            </Button>
          </Section>
        </div>
      </PageTransition>
    </AppShell>
  )
}
