import { useEffect, useState } from "react";
import { isImageStoreRef, loadImageRef } from "@/lib/image-store";

export function useResolvedImage(ref: string | undefined): string {
  const [src, setSrc] = useState(() => {
    if (!ref?.trim()) return "";
    if (isImageStoreRef(ref)) return "";
    return ref;
  });

  useEffect(() => {
    if (!ref?.trim()) {
      setSrc("");
      return;
    }

    if (!isImageStoreRef(ref)) {
      setSrc(ref);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    loadImageRef(ref)
      .then((resolved) => {
        if (!active) {
          if (resolved.startsWith("blob:")) URL.revokeObjectURL(resolved);
          return;
        }
        if (resolved.startsWith("blob:")) objectUrl = resolved;
        setSrc(resolved);
      })
      .catch(() => {
        if (active) setSrc("");
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ref]);

  return src;
}
