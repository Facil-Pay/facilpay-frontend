/** Miniature hosted checkout that reflects the branding being edited. */
export function CheckoutPreview({ logo, brandColor, businessName }: { logo: string | null; brandColor: string; businessName: string }) {
  const color = /^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : "#20A7EE";

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm" aria-label="Checkout preview">
      <div className="h-1.5" style={{ background: color }} />
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-zinc-200">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- preview may be a local data URL
              <img src={logo} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="text-sm font-bold" style={{ color }}>
                {businessName.charAt(0).toUpperCase() || "F"}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">{businessName || "Your business"}</p>
            <p className="text-[11px] text-zinc-500">Secure checkout</p>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 ring-1 ring-zinc-200">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Order total</p>
          <p className="text-2xl font-semibold text-zinc-900">
            25.00 <span className="text-sm font-medium text-zinc-500">USDC</span>
          </p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {["USDC", "XLM", "EURC"].map((asset, index) => (
              <span
                key={asset}
                className="rounded-md border px-2 py-1 text-center text-[11px] font-medium"
                style={index === 0 ? { borderColor: color, color } : undefined}
              >
                {asset}
              </span>
            ))}
          </div>
        </div>

        <button type="button" tabIndex={-1} className="w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ background: color }}>
          Connect wallet to pay
        </button>
        <p className="text-center text-[10px] text-zinc-400">Payments powered by FacilPay</p>
      </div>
    </div>
  );
}
