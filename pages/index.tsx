import { useEffect } from "react";
import Tabs from "./tabs";

export default function Home() {
  useEffect(() => {
    // Ensure window is properly sized for desktop app
    if (typeof window !== "undefined") {
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.body.style.overflow = "hidden";
    }
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      {/* Tab Bar at the top */}
      <Tabs />

      {/* Content area where views will be displayed */}
      <div className="flex-1 relative">
        {/* This area will be covered by ToDesktop views */}
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              ToDesktop Tab Browser
            </h2>
            <p className="text-sm">Web views will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
