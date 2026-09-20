import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Business CRM",
    short_name: "CRM",
    description:
      "Private business job management system.",
    start_url: "/admin",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/favicon.svg?v=4",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}