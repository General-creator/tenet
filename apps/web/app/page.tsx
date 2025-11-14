export default function HomePage(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 py-12 text-center">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Tenet</p>
        <h1 className="text-3xl font-semibold text-foreground">Cognitive Telecom Platform</h1>
        <p className="text-base text-gray-600">
          Monorepo scaffold is ready. Continue implementing the routing engine, SOP stack, integrations,
          and UI modules according to the Tenet specifications.
        </p>
      </div>
    </main>
  )
}
