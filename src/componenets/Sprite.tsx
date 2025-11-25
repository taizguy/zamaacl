import React from "react";
import { useAsset } from "../hooks/useAsset";
import { AssetFallback } from "./AssetFallback";

export function Sprite({ src }: { src: string }) {
    const { status, data } = useAsset(src, "image");

    if (status === "missing") return <AssetFallback label={src} />;
    if (status === "loading") return <div>Loading sprite…</div>;

    return <img src={data} alt="sprite" className="sprite-frame" />;
}
