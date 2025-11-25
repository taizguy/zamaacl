import React from "react";
import { useAsset } from "../hooks/useAsset";
import { AssetFallback } from "./AssetFallback";

export function SFX({ src }: { src: string }) {
    const { status, data } = useAsset(src, "audio");

    if (status === "missing") return <AssetFallback label={src} />;
    if (status === "loading") return null;

    const play = () => {
        const audio = new Audio(data);
        audio.play();
    };

    return (
        <button className="px-3 py-2 bg-blue-700 rounded" onClick={play}>
            Play SFX
        </button>
    );
}
