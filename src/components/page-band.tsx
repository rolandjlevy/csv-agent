import type { ReactNode } from "react";

// The teal heading band for every screen after the home page. The content
// below overlaps its lower edge (-mt-16 / md:-mt-20 on the <main>), which is
// why the bottom padding is generous. It carries the page's one <h1>.
export function PageBand({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section aria-labelledby="page-title" className="on-band bg-band text-band-text">
      <div className="mx-auto max-w-5xl px-6 pb-28 pt-6 md:pb-32 md:pt-12">
        <h1
          id="page-title"
          className="font-display text-[2.125rem] font-bold leading-[1.05] tracking-tight text-white md:text-5xl"
        >
          {title}
        </h1>
        {children && (
          <p className="mt-3 max-w-xl text-base leading-relaxed md:text-[17px]">{children}</p>
        )}
      </div>
    </section>
  );
}
