import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function NoAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <div className="max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <ShieldX className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold text-zinc-900">No access</h1>
        <p className="mt-2 text-sm text-zinc-500">Your role doesn&apos;t have permission to view this page. Ask an owner or admin to change your role.</p>
        <Link href="/overview" className="mt-6 inline-block rounded-md bg-[#000F24] px-4 py-2 text-sm font-medium text-white">Back to dashboard</Link>
      </div>
    </main>
  );
}
