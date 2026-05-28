import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fake News Classifier — BERT on PolitiFact",
  description:
    "Fine-tuned BERT model for fake-news classification, served via FastAPI with integrated-gradients explanations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
