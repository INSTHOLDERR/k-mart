export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background:"var(--bg-2)" }}>
      <div className="w-9 h-9 rounded-full border-4 animate-spin"
        style={{ borderColor:"var(--blue-light)", borderTopColor:"var(--blue)" }} />
      <span className="text-sm font-bold tracking-wide" style={{ color:"var(--blue)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>K Mart</span>
    </div>
  );
}
