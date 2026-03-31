import React, { useEffect } from "react";
import { createPageUrl } from "@/utils";

// This page has been merged into TenantManagement — redirect there
export default function RentalContractPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const listingId = params.get("listing_id");
    window.location.replace(createPageUrl("TenantManagement") + (listingId ? `?listing_id=${listingId}` : ""));
  }, []);
  return null;
}