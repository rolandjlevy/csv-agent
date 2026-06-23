export function Header() {
  return (
    <header className="flex flex-col items-center gap-1 px-4 pt-12 pb-6 text-center sm:pt-16">
      <div className="flex items-center gap-2">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="text-accent"
        >
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <path d="M14 3v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </svg>
        <h1 className="font-mono text-lg font-semibold tracking-tight text-text">
          CSV Agent
        </h1>
      </div>
      <p className="text-sm text-text-muted">Drop a CSV. Ask anything.</p>
    </header>
  );
}
