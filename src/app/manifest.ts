import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tarbiyah – Islamic Parenting & Child Care",
    short_name: "Tarbiyah",
    description:
      "Tarbiyah হল একটি শিশু বিশেষজ্ঞ ও ইসলামিক গাইডেন্স অ্যাপ, যেখানে আপনার সন্তানের বয়স অনুযায়ী মেডিকেল ও ইসলামিক সাজেশন পাবেন।",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ecfdf5",
    theme_color: "#059669",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}

