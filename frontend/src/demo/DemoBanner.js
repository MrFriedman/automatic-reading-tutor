import React from "react";
import { isDemoMode } from "./config";

export const DEMO_BANNER_TEXT =
  "Demo mode, UCT 3rd-year CS project, presented at the School of IT Expo 2024";

export const DEMO_BANNER_URL = "https://dylanfriedman.co.za";

export default function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div
      style={{
        backgroundColor: "#12355b",
        color: "#ffffff",
        textAlign: "center",
        padding: "8px 16px",
        fontSize: "0.875rem",
        lineHeight: 1.4,
        position: "sticky",
        top: 0,
        zIndex: 2000,
      }}
    >
      <a
        href={DEMO_BANNER_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#ffffff", textDecoration: "underline" }}
      >
        {DEMO_BANNER_TEXT}
      </a>
    </div>
  );
}
