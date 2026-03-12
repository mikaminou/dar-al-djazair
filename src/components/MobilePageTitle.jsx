import React from "react";

export default function MobilePageTitle({ title, children }) {
  return (
    <div className="hidden md:block">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      {children}
    </div>
  );
}