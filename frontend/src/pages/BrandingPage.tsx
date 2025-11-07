import Logo from "../components/branding/Logo";

export default function BrandingPage() {
  return (
    <main className="min-h-screen bg-ak-bg text-ak-text-primary">
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center gap-4">
          <Logo size="lg" />
          <h1 className="text-3xl font-semibold">AKIS Brand Preview</h1>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-2xl border border-ak-border bg-ak-surface-2 p-6">
            <p className="text-sm text-ak-text-secondary">Surface 2</p>
            <div className="mt-4 h-16 rounded-lg bg-ak-surface" />
          </div>
          <div className="rounded-2xl border border-ak-border bg-ak-surface-2 p-6">
            <p className="text-sm text-ak-text-secondary">Primary</p>
            <div className="mt-4 h-16 rounded-lg bg-ak-primary" />
          </div>
          <div className="rounded-2xl border border-ak-border bg-ak-surface-2 p-6">
            <p className="text-sm text-ak-text-secondary">Background</p>
            <div className="mt-4 h-16 rounded-lg bg-ak-bg" />
          </div>
        </div>
      </section>
    </main>
  );
}
