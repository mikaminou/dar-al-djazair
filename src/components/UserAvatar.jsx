import React from "react";

/**
 * Reusable avatar component — shows photo if available, otherwise initials.
 * Props: user (object with avatar_url, first_name, last_name, full_name, email)
 *        size: "xs" | "sm" | "md" | "lg" (default "md")
 *        className: extra classes
 */
const SIZES = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-16 h-16 text-2xl",
  xl: "w-20 h-20 text-3xl",
};

export default function UserAvatar({ user, size = "md", className = "" }) {
  const sizeClass = SIZES[size] || SIZES.md;

  const initials = (() => {
    if (user?.first_name && user?.last_name) {
      return (user.first_name[0] + user.last_name[0]).toUpperCase();
    }
    if (user?.full_name) {
      const parts = user.full_name.trim().split(" ");
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    }
    if (user?.email) return user.email[0].toUpperCase();
    return "?";
  })();

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={initials}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 select-none ${className}`}
    >
      {initials}
    </div>
  );
}