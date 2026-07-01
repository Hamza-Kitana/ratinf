import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  getAvatarStyle,
  getDisplayName,
  getInitials,
  hasCharacterImage,
} from "@/lib/avatar-utils";

const SIZE_MAP = {
  sm: { box: "h-14 w-14", text: "text-sm", name: "text-[8px]", rounded: "rounded-xl", ring: "ring-1" },
  md: { box: "h-20 w-20", text: "text-xl", name: "text-[9px]", rounded: "rounded-2xl", ring: "ring-2" },
  lg: { box: "h-32 w-32 md:h-40 md:w-40", text: "text-3xl md:text-4xl", name: "text-xs", rounded: "rounded-3xl", ring: "ring-4" },
  xl: { box: "h-40 w-40 md:h-48 md:w-48", text: "text-4xl md:text-5xl", name: "text-sm", rounded: "rounded-full", ring: "ring-4" },
  runner: { box: "h-24 w-24", text: "text-2xl", name: "text-[10px]", rounded: "rounded-2xl", ring: "ring-2" },
} as const;

type AvatarSize = keyof typeof SIZE_MAP;

type CharacterAvatarProps = {
  name: string;
  image?: string;
  size?: AvatarSize;
  className?: string;
  glow?: boolean;
  showNameInAvatar?: boolean;
  ringClassName?: string;
  style?: CSSProperties;
};

export function CharacterAvatar({
  name,
  image = "",
  size = "md",
  className,
  glow = true,
  showNameInAvatar = false,
  ringClassName,
  style,
}: CharacterAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const s = SIZE_MAP[size];
  const hasImage = hasCharacterImage(image) && !imgFailed;
  const { hue, hue2 } = getAvatarStyle(name);
  const initials = getInitials(name);
  const stackedName = getDisplayName(name);
  const useStackedName = showNameInAvatar || size === "xl" || size === "lg";

  if (hasImage) {
    return (
      <div className={cn("relative shrink-0", className)}>
        {glow && (
          <div
            className={cn("absolute inset-0 bg-gradient-royal opacity-40 blur-md transition group-hover:opacity-70", s.rounded)}
          />
        )}
        <img
          src={image}
          alt={name}
          onError={() => setImgFailed(true)}
          className={cn(
            "relative object-cover",
            s.box,
            s.rounded,
            s.ring,
            ringClassName ?? "ring-primary/40",
          )}
          style={style}
        />
      </div>
    );
  }

  return (
    <NameAvatarFallback
      name={name}
      initials={initials}
      stackedName={stackedName}
      hue={hue}
      hue2={hue2}
      size={size}
      useStackedName={useStackedName}
      className={className}
      glow={glow}
      ringClassName={ringClassName}
      style={style}
    />
  );
}

function NameAvatarFallback({
  name,
  initials,
  stackedName,
  hue,
  hue2,
  size,
  useStackedName,
  className,
  glow = true,
  ringClassName,
  style,
}: {
  name: string;
  initials: string;
  stackedName: string;
  hue: number;
  hue2: number;
  size: AvatarSize;
  useStackedName: boolean;
  className?: string;
  glow?: boolean;
  ringClassName?: string;
  style?: React.CSSProperties;
}) {
  const s = SIZE_MAP[size];
  const showFullName = useStackedName && name.trim().length > 0;

  return (
    <div className={cn("relative shrink-0", className)}>
      {glow && (
        <div
          className={cn("absolute inset-0 animate-avatar-glow blur-xl opacity-60", s.rounded)}
          style={{
            background: `linear-gradient(135deg, oklch(0.55 0.22 ${hue}), oklch(0.65 0.26 ${hue2}))`,
          }}
        />
      )}
      <div
        className={cn(
          "avatar-name relative flex flex-col items-center justify-center overflow-hidden p-2 text-center",
          s.box,
          s.rounded,
          s.ring,
          ringClassName ?? "ring-primary/50",
        )}
        style={{
          ...style,
          background: `linear-gradient(145deg, oklch(0.32 0.14 ${hue}) 0%, oklch(0.48 0.22 ${hue2}) 55%, oklch(0.38 0.18 ${hue}) 100%)`,
          boxShadow: `inset 0 1px 0 oklch(1 0 0 / 18%), 0 8px 32px oklch(0.25 0.12 ${hue} / 45%)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, oklch(1 0 0 / 25%), transparent 50%), radial-gradient(circle at 80% 80%, oklch(0.2 0.05 300 / 40%), transparent 55%)",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />

        {showFullName ? (
          <span
            className={cn(
              "relative z-10 line-clamp-3 whitespace-pre-line font-black leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_oklch(0.1_0.05_300/80%)]",
              s.name,
              size === "xl" ? "text-base md:text-lg" : size === "lg" ? "text-sm md:text-base" : s.name,
            )}
          >
            {stackedName}
          </span>
        ) : (
          <span
            className={cn(
              "relative z-10 font-black tracking-wider text-white drop-shadow-[0_2px_10px_oklch(0.1_0.05_300/90%)]",
              s.text,
            )}
          >
            {initials}
          </span>
        )}

        {!showFullName && name.trim() && size !== "sm" && (
          <span className="relative z-10 mt-0.5 max-w-full truncate px-1 text-[9px] font-bold text-white/75">
            {name.split(/\s+/)[0]}
          </span>
        )}
      </div>
    </div>
  );
}

export function CharacterAvatarPreview({ name, image }: { name: string; image: string }) {
  if (!name.trim() && !hasCharacterImage(image)) {
    return (
      <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-dashed border-primary/40 bg-secondary/40 text-3xl text-muted-foreground">
        ✦
      </div>
    );
  }

  return (
    <CharacterAvatar
      name={name.trim() || "جيمس مورفي"}
      image={image}
      size="lg"
      showNameInAvatar
      className="scale-90"
    />
  );
}
