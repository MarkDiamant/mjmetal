import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-black text-orange-600">404</h1>

      <h2 className="mt-4 text-3xl font-black">
        Page not found
      </h2>

      <p className="mt-4 max-w-md text-neutral-600">
        Sorry, the page you're looking for doesn't exist.
      </p>

      <Link
        href="/"
        className="mt-8 rounded bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
      >
        Back to Home
      </Link>
    </main>
  );
}