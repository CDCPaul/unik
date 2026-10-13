import { Section } from './Section';

export function LegalPage({ doc }: { doc: { title: string; updated: string; sections: { heading: string; body: readonly string[] }[] } }) {
  return (
    <Section width="narrow" className="flex flex-col gap-8">
      <div>
        <h1 className="font-race text-5xl font-extrabold uppercase text-brand-ink">{doc.title}</h1>
        <p className="text-sm">Last updated: {doc.updated}</p>
      </div>
      {doc.sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-2">
          <h2 className="text-xl font-extrabold text-brand-ink">{s.heading}</h2>
          {s.body.map((p) => <p key={p}>{p}</p>)}
        </section>
      ))}
    </Section>
  );
}
