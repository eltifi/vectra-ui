/**
 * @file layout.tsx
 * @brief Root layout component for VECTRA UI application
 * @details
 * Defines the HTML structure and global metadata for the VECTRA UI (Vehicle Evacuation 
 * Counterflow Traffic Resilience Application) Next.js application.
 * 
 * @see page.tsx for the main application page
 * @see components/MapLayer.tsx for interactive map visualization
 * @see components/ControlPanel.tsx for user controls
 */

import type { Metadata } from "next";
import "./globals.css";

/**
 * @brief Global application metadata
 * @details 
 * Sets the HTML title, description, and SEO meta tags.
 * Title: " VECTRA UI  | Florida Evacuation Analysis"
 * Description: Florida Evacuation Analysis System using FDOT public data
 */
export const metadata: Metadata = {
    title: " VECTRA UI  | Florida Evacuation Analysis",
    description: "Florida Evacuation Analysis System using FDOT public data. Not affiliated with or sponsored by FDOT or the State of Florida.",
};

/**
 * @brief Root layout component for the VECTRA UI application
 * @details
 * Wraps all page content with HTML structure and initializes global styling.
 * Uses Next.js App Router layout pattern for SSR-compatible component tree.
 * 
 * @param children React child components to render within the layout
 * @returns JSX.Element - HTML root element with metadata and child content
 * 
 * @note Next.js metadata export above is required for proper head tag rendering
 */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body style={{ margin: 0, padding: 0 }}>
                {children}
            </body>
        </html>
    );
}
