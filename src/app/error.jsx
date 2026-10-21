"use client";

export default function ErrorScreen({ reset }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-950 px-6 text-white">
      <div
        role="alert"
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/5 p-6 shadow-xl"
      >
        <h1 className="text-lg font-semibold">The desktop couldn’t load</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Try again to reopen the desktop. Your saved notes will remain on this device.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
