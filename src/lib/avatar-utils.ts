export function hasCharacterImage(image: string | undefined): boolean {
  if (!image?.trim()) return false;
  return true;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.slice(0, 2).toUpperCase();
}

export function getAvatarStyle(name: string): { hue: number; hue2: number } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return { hue, hue2: (hue + 42) % 360 };
}

export function getDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name.trim();
  if (name.length <= 14) return name.trim();
  return `${parts[0]}\n${parts.slice(1).join(" ")}`;
}
