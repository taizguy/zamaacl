import { useState, useEffect } from "react";

export function useAsset(path: string, type: "image" | "audio" | "json") {
    const [status, setStatus] = useState<"loading" | "loaded" | "missing">("loading");
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fullPath = process.env.PUBLIC_URL + path;

        async function load() {
            try {
                if (type === "image") {
                    const img = new Image();
                    img.src = fullPath;
                    img.onload = () => {
                        setStatus("loaded");
                        setData(fullPath);
                    };
                    img.onerror = () => setStatus("missing");
                }

                if (type === "audio") {
                    const audio = new Audio(fullPath);
                    audio.oncanplaythrough = () => {
                        setStatus("loaded");
                        setData(fullPath);
                    };
                    audio.onerror = () => setStatus("missing");
                }

                if (type === "json") {
                    const response = await fetch(fullPath);
                    if (!response.ok) {
                        setStatus("missing");
                        return;
                    }
                    const json = await response.json();
                    setData(json);
                    setStatus("loaded");
                }
            } catch (e) {
                setStatus("missing");
            }
        }

        load();
    }, [path, type]);

    return { status, data };
}
