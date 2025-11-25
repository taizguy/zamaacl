

export function AssetFallback({ label }: { label: string }) {
    return (
        <div className="p-4 bg-red-500/20 border border-red-400 rounded-lg text-center text-red-300">
            ❗ Missing asset: <strong>{label}</strong>
            <br />
            <span className="text-xs opacity-80">
                Place the correct file in <code>/public/{label}</code>
            </span>
        </div>
    );
}
