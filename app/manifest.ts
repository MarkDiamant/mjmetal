import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "M&J Metal CRM",
    short_name: "M&J CRM",
    description:
      "Private M&J Metal job management system.",
    start_url: "/admin",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ea580c",
    icons: [
      {
        src: "/favicon.svg?v=4",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}