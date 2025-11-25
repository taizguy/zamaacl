import React from "react";
import Lottie from "lottie-react";
import { useAsset } from "../hooks/useAsset";
import { AssetFallback } from "./AssetFallback";

export function LottieAuto({ src }: { src: string }) {
    const { status, data } = useAsset(src, "json");

    if (status === "missing") return <AssetFallback label={src} />;
    if (status === "loading") return <div>Loading animation…</div>;

    return <Lottie animationData={data} loop={true} />;
}
