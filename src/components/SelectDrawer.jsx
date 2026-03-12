import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

/**
 * Mobile-optimized select dropdown using Drawer
 * Displays options in a bottom sheet on mobile, standard select on desktop
 */
export default function SelectDrawer({ 
  open, 
  onOpenChange, 
  options, 
  value, 
  onValueChange, 
  label,
  isMobile = typeof window !== 'undefined' && window.innerWidth < 768
}) {
  if (!isMobile) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-6">
        <DrawerHeader className="flex items-center justify-between px-4">
          <DrawerTitle>{label}</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex flex-col gap-2 px-4 max-h-96 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onValueChange(option.value);
                onOpenChange(false);
              }}
              className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                value === option.value
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}