import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "情境书签 · 此刻，翻一页", description: "把此刻的心事，放进一页有出处的文字里。", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" }};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="zh-CN"><body>{children}</body></html>}
