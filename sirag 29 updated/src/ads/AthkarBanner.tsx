import React from "react";
import BannerPreview from "./BannerPreview";
// A clearly marked preview makes the two placements reviewable in the web build.
export default function AthkarBanner({ placement }: { placement: 1 | 2 }) {
  return <BannerPreview placement={placement} />;
}
