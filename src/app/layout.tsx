import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ThemeToggle } from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tarbiyah – Islamic Parenting & Child Care",
  description:
    "Tarbiyah হল একটি শিশু বিশেষজ্ঞ ও ইসলামিক গাইডেন্স অ্যাপ, যেখানে আপনার সন্তানের বয়স অনুযায়ী মেডিকেল ও ইসলামিক সাজেশন পাবেন।",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=document.documentElement;var s=localStorage.getItem('tarbiyah-theme');t.dataset.theme=(s==='dark'||s==='light'?s:'light');})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoNaskhArabic.variable} antialiased`}
      >
        <div className="tarbiyah-shell min-h-screen text-body-primary">
          <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-3 pb-8 pt-4 sm:px-4 sm:pb-10 sm:pt-6 lg:px-8">
            <header className="header-bar mb-5 flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-xs shadow-sm shadow-emerald-100 backdrop-blur sm:mb-6 sm:px-4 sm:py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 shadow-sm shadow-emerald-200 sm:h-10 sm:w-10">
                  <span className="header-logo text-base font-semibold sm:text-lg">
                    T
                  </span>
                </div>
                <div>
                  <h1 className="header-title text-base font-semibold tracking-tight sm:text-xl">
                    Tarbiyah
                  </h1>
                  <p className="text-[11px] text-muted-soft sm:text-xs">
                    নবজাতক থেকে ৫ বছর – ইসলামিক ও মেডিকেল গাইডেন্স
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </header>
            <main className="flex-1">{children}</main>
            <footer className="mt-5 border-t border-emerald-100 pt-3 text-center text-[11px] text-muted-soft sm:mt-6 sm:pt-4 sm:text-xs">
              <p>© {new Date().getFullYear()} Tarbiyah. সকল অধিকার সংরক্ষিত।</p>
            </footer>
          </div>
          <ServiceWorkerRegister />
        </div>
      </body>
    </html>
  );
}
