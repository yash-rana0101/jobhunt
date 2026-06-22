type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageShell({ eyebrow, title, description }: PageShellProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">{eyebrow}</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-slate-950">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
    </section>
  );
}
