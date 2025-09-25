import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'FlowStream AI - Ecommerce Dashboard',
  description: 'Multi-project ecommerce dashboard with performance metrics and flow analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="dashboard">
          <header className="header">
            <div className="flex">
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                FlowStream AI
              </h1>
              <span className="text-small" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Experience is everything
              </span>
            </div>
            <nav className="flex">
              <a href="/" style={{ color: '#fff', padding: '0.5rem 1rem' }}>
                All Projects
              </a>
            </nav>
          </header>
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}