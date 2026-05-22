import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kairo — Event Discovery",
    short_name: "Kairo",
    description: "Discover events, hackathons, concerts and more happening around you",
    start_url: "/feed",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#8b5cf6",
    icons: [
      { src: "/kairo_app_icon_1779454125080.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
