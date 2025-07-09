import { useState, useEffect } from "react";
import { views, webContents, nativeWindow } from "@todesktop/client-core";
import type { Ref } from "@todesktop/client-core/invoke";
import type { WebContents } from "@todesktop/client-electron-types";

interface Tab {
  id: string;
  title: string;
  url: string;
  viewRef?: Ref;
  webContents?: WebContents;
  isActive: boolean;
}

export default function Tabs() {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "1",
      title: "Projects",
      url: "http://localhost:5173",
      isActive: true,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState("1");

  // Initialize views on mount
  useEffect(() => {
    initializeTabs();
  }, []);

  const initializeTabs = async () => {
    // Create initial view for the first tab
    try {
      const viewRef = await views.create({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Add the view to the current window
      await nativeWindow.addBrowserView({ viewRef });

      // Set bounds for the view
      await views.setBounds({
        ref: viewRef,
        bounds: {
          x: 0,
          y: 80, // Leave space for tab bar
          width: window.innerWidth,
          height: window.innerHeight - 80,
        },
      });

      // Get webContents to load URL
      const webContentsObj = await views.getWebContents({ ref: viewRef });
      await webContents.loadURL({ ref: webContentsObj as any }, tabs[0].url);

      // TODO: Add page title updates when ToDesktop API supports it

      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === "1"
            ? {
                ...tab,
                viewRef,
                webContents: webContentsObj,
              }
            : tab
        )
      );
    } catch (error) {
      console.error("Error creating initial view:", error);
    }
  };

  const createNewTab = async () => {
    const newTabId = Date.now().toString();
    const newTab: Tab = {
      id: newTabId,
      title: "New Tab",
      url: "http://localhost:5173",
      isActive: false,
    };

    try {
      const viewRef = await views.create({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Add the view to the current window
      await nativeWindow.addBrowserView({ viewRef });

      // Set bounds for the view
      await views.setBounds({
        ref: viewRef,
        bounds: {
          x: 0,
          y: 80,
          width: window.innerWidth,
          height: window.innerHeight - 80,
        },
      });

      const webContentsObj = await views.getWebContents({ ref: viewRef });
      await webContents.loadURL({ ref: webContentsObj as any }, newTab.url);

      // TODO: Add page title updates when ToDesktop API supports it

      const tabWithView = {
        ...newTab,
        viewRef,
        webContents: webContentsObj,
      };

      setTabs((prev) => [...prev, tabWithView]);
      switchToTab(newTabId);
    } catch (error) {
      console.error("Error creating new tab:", error);
    }
  };

  const switchToTab = async (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab || !tab.viewRef) return;

    try {
      // Hide all other views by removing them from the window
      await Promise.all(
        tabs
          .filter((t) => t.viewRef && t.id !== tabId)
          .map((t) => nativeWindow.removeBrowserView({ viewRef: t.viewRef! }))
      );

      // Show the selected view by adding it back and setting bounds
      await nativeWindow.addBrowserView({ viewRef: tab.viewRef });
      await views.setBounds({
        ref: tab.viewRef,
        bounds: {
          x: 0,
          y: 80,
          width: window.innerWidth,
          height: window.innerHeight - 80,
        },
      });

      setActiveTabId(tabId);
      setTabs((prev) =>
        prev.map((t) => ({
          ...t,
          isActive: t.id === tabId,
        }))
      );
    } catch (error) {
      console.error("Error switching tabs:", error);
    }
  };

  const closeTab = async (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    try {
      // Remove the view from the window
      if (tab.viewRef) {
        await nativeWindow.removeBrowserView({ viewRef: tab.viewRef });
      }

      const newTabs = tabs.filter((t) => t.id !== tabId);
      setTabs(newTabs);

      // If we closed the active tab, switch to another one
      if (tabId === activeTabId && newTabs.length > 0) {
        switchToTab(newTabs[0].id);
      } else if (newTabs.length === 0) {
        // Create a new tab if all tabs are closed
        createNewTab();
      }
    } catch (error) {
      console.error("Error closing tab:", error);
    }
  };

  const updateTabTitle = (tabId: string, title: string) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, title } : t)));
  };

  // Handle window resize to update view bounds
  useEffect(() => {
    const handleResize = async () => {
      try {
        const activeTab = tabs.find((t) => t.id === activeTabId);
        if (activeTab?.viewRef) {
          await views.setBounds({
            ref: activeTab.viewRef,
            bounds: {
              x: 0,
              y: 80,
              width: window.innerWidth,
              height: window.innerHeight - 80,
            },
          });
        }
      } catch (error) {
        console.error("Error resizing views:", error);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [tabs, activeTabId]);

  return (
    <div className="bg-gray-100 border-b border-gray-300 h-20 flex items-center px-4 gap-2 tab-container app-drag">
      {/* Tab Bar */}
      <div className="flex gap-1 flex-1 overflow-x-auto tab-overflow app-draggable-except-children">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer min-w-0 max-w-48 transition-colors
              ${
                tab.isActive
                  ? "bg-white border-t border-l border-r border-gray-300 shadow-sm"
                  : "bg-gray-200 hover:bg-gray-250"
              }
            `}
            onClick={() => switchToTab(tab.id)}
          >
            <span className="truncate text-sm flex-1" title={tab.title}>
              {tab.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="w-4 h-4 rounded-full hover:bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 hover:text-gray-800"
              title="Close tab"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* New Tab Button */}
      <button
        onClick={createNewTab}
        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-lg font-semibold text-gray-600 hover:text-gray-800 transition-colors"
        title="New Tab"
      >
        +
      </button>
    </div>
  );
}
