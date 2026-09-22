import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "M&J Metal Business Software",
    short_name: "M&J",
    description: "M&J Metal business management software.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/images/logo.png?v=4", sizes: "any", type: "image/png" },
    ],
  };
}
