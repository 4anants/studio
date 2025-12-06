import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { User } from "./mock-data";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarSrc(user: { avatar?: string } | User, size: number = 128) {
  if (user.avatar && user.avatar.startsWith('data:image')) {
    return user.avatar;
  }
  return `https://picsum.photos/seed/${user.avatar}/${size}/${size}`;
}
