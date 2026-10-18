import React from "react";
import useWindowsStore from "@store/window";

const SettingsAppearancePane = () => {
  const { systemSettings, updateSystemSetting } = useWindowsStore();
  const darkMode = !!systemSettings.darkMode;
  const selectedMode = darkMode ? "dark" : "light";

  return (
    <div className="max-w-2xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider ml-1 mb-4">
        Appearance
      </h3>
      <div className="flex gap-8 mb-6">
        {/* Light Mode */}
        <div
          onClick={() => updateSystemSetting("darkMode", false)}
          className="flex flex-col items-center gap-2 cursor-pointer"
        >
          <div
            className={`w-24 h-16 rounded-md border-2 shadow-sm overflow-hidden flex flex-col transition-all ${
              selectedMode === "light"
                ? "border-blue-500"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
            style={{
              backgroundColor: "#f4f4f5",
            }}
          >
            <div style={{ backgroundColor: "#ffffff" }} className="h-4 border-b border-gray-200"></div>
            <div style={{ backgroundColor: "#f4f4f5" }} className="flex-1 p-1">
              <div style={{ backgroundColor: "#ffffff" }} className="w-full h-full rounded-sm shadow-sm"></div>
            </div>
          </div>
          <span
            className={`text-[12px] font-medium transition-colors ${
              selectedMode === "light" ? "text-gray-900 font-semibold" : "text-gray-500"
            }`}
          >
            Light
          </span>
        </div>

        {/* Dark Mode */}
        <div
          onClick={() => updateSystemSetting("darkMode", true)}
          className="flex flex-col items-center gap-2 cursor-pointer"
        >
          <div
            className={`w-24 h-16 rounded-md bg-gray-800 border-2 shadow-sm overflow-hidden flex flex-col transition-all ${
              selectedMode === "dark"
                ? "border-blue-500"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <div className="h-4 bg-[#2c2c2e] border-b border-black"></div>
            <div className="flex-1 bg-[#1e1e1e] p-1">
              <div className="w-full h-full bg-[#2c2c2e] rounded-sm shadow-sm"></div>
            </div>
          </div>
          <span
            className={`text-[12px] font-medium transition-colors ${
              selectedMode === "dark" ? "text-gray-900 font-semibold" : "text-gray-500"
            }`}
          >
            Dark
          </span>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 ml-1">
        Applies system-wide — menu bar, dock, windows and apps.
      </p>
    </div>
  );
};

export default SettingsAppearancePane;
