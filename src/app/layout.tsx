import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Harked',
  description: 'See your Spotify stats, make recommendations, review albums and compare it all with your friends!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}