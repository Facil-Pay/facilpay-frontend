export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#000F24] px-6 text-center text-white">
      <h1 className="text-xl font-bold">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-zinc-300">
        FacilPay couldn&apos;t reach the network. Check your connection and
        try again — any page you&apos;ve already opened on this device may
        still be available from cache.
      </p>
    </div>
  );
}
