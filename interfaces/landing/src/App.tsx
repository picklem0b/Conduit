import { HeroSection } from "./sections/hero.section";
import { FeaturesSection } from "./sections/features.section";
import { DeploySection } from "./sections/deploy.section";

export default function App() {
    return (
        <>
            <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }

        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #080808;
          color: #e5e5e5;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow-x: hidden;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }

        /* Code */
        code {
          font-family: ui-monospace, 'Cascadia Code', 'SF Mono', monospace;
          font-size: 0.9em;
          color: #999;
          background: #141414;
          padding: 1px 5px;
          border-radius: 3px;
        }

        /* Link reset */
        a { color: inherit; }

        /* Button reset */
        button { font-family: inherit; }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Safe area */
        @supports (padding: env(safe-area-inset-bottom)) {
          body {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>

            <main>
                <HeroSection />
                <FeaturesSection />
                <DeploySection />
            </main>
        </>
    );
}
