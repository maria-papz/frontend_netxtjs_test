import type { Metadata } from "next";
import "./globals.css";
import { Wix_Madefor_Text } from 'next/font/google';
import Provider from '@/redux/provider';
import Setup from '@/components/utils/Setup';
import { ThemeProvider } from "@/components/theme-provider";
// import useVerify from "@/hooks/use-verify";


// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });



// const nunito = Nunito({
//   subsets: ['latin'],
//   weight: ['400', '700'], // adjust weights as needed
// });

const bellota = Wix_Madefor_Text({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700','800'], // 300=light, 400=regular, 500=medium, 600=semibold, 700=bold
});

export const metadata: Metadata = {
  title: "KOE DB",
  description: "Database for the University of Cyprus Economics Research Centre",
  icons: {
    icon: [
      { url: '/images/University_of_Cyprus-white.svg', type: 'image/svg+xml' }
    ],
    apple: { url: '/images/University_of_Cyprus-white.svg', type: 'image/svg+xml' }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>)
{
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={bellota.className}
      >
        <Provider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Setup />
            {/* <Toaster /> */}

              <div vaul-drawer-wrapper="" className="bg-background flex-1">
                {children}
              </div>
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}
