import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { GravityLanding } from "@/components/landing/GravityLanding";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
});

export default function HomePage() {
  return (
    <main className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <GravityLanding />
    </main>
  );
}
