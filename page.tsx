import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 p-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
        Guidekul Career DNA
      </h1>
      <p className="max-w-md text-neutral-600">
        A simple way for Indian students to explore careers, day to day reality,
        salaries, and the route to get there.
      </p>
      <Link
        href="/career-dna"
        className="rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white transition-colors hover:bg-emerald-800"
      >
        Open the tool
      </Link>
    </main>
  );
}
