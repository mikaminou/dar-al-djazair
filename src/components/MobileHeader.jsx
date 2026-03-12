import React from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Mobile-only header with dynamic back button and title
 * Shows back button for child routes, logo/title for root routes
 * Hidden on md+ screens
 */
export default function MobileHeader({ title }) {
  const location = useLocation();
  const canGoBack = window.history.length > 1;
  const isRootRoute = location.pathname === "/" || location.pathname === "/Home";

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Back button or spacer */}
        <div className="w-10">
          {!isRootRoute && canGoBack ? (
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-500 select-none"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}
        </div>

        {/* Title */}
        <div className="flex-1 text-center px-2 select-none">
          <h1 className="font-bold text-gray-900 dark:text-white text-sm truncate">
            {title}
          </h1>
        </div>

        {/* Spacer to balance back button */}
        <div className="w-10" />
      </div>
    </div>
  );
}