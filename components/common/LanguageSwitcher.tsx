"use client";

import { useLanguage } from "@/components/providers/LanguageContext";
import { Button } from "@/components/ui/button";

const TRFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
  >
    <rect
      x="1"
      y="4"
      width="30"
      height="24"
      rx="4"
      ry="4"
      fill="#d12d24"
    ></rect>
    <path
      d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
      opacity=".15"
    ></path>
    <path
      d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z"
      fill="#fff"
      opacity=".2"
    ></path>
    <path
      fill="#fff"
      d="M19.807 16L21 14.358 19.069 14.985 17.876 13.342 17.876 15.373 15.945 16 17.876 16.627 17.876 18.658 19.069 17.015 21 17.642 19.807 16z"
    ></path>
    <path
      d="M15.953,19.325c-1.837,1.65-4.663,1.5-6.314-.337s-1.5-4.663,.337-6.314c1.837-1.65,4.663-1.5,6.314,.337-.442-.699-1.035-1.292-1.734-1.734-2.608-1.65-6.06-.874-7.711,1.734-1.65,2.608-.874,6.06,1.734,7.711,2.608,1.65,6.06,.874,7.711-1.734-.106,.118-.219,.231-.337,.337Z"
      fill="#fff"
    ></path>
  </svg>
);

const ENFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
  >
    <rect
      x="1"
      y="4"
      width="30"
      height="24"
      rx="4"
      ry="4"
      fill="#071b65"
    ></rect>
    <path
      d="M5.101,4h-.101c-1.981,0-3.615,1.444-3.933,3.334L26.899,28h.101c1.981,0,3.615-1.444,3.933-3.334L5.101,4Z"
      fill="#fff"
    ></path>
    <path
      d="M22.25,19h-2.5l9.934,7.947c.387-.353,.704-.777,.929-1.257l-8.363-6.691Z"
      fill="#b92932"
    ></path>
    <path
      d="M1.387,6.309l8.363,6.691h2.5L2.316,5.053c-.387,.353-.704,.777-.929,1.257Z"
      fill="#b92932"
    ></path>
    <path
      d="M5,28h.101L30.933,7.334c-.318-1.891-1.952-3.334-3.933-3.334h-.101L1.067,24.666c.318,1.891,1.952,3.334,3.933,3.334Z"
      fill="#fff"
    ></path>
    <rect x="13" y="4" width="6" height="24" fill="#fff"></rect>
    <rect x="1" y="13" width="30" height="6" fill="#fff"></rect>
    <rect x="14" y="4" width="4" height="24" fill="#b92932"></rect>
    <rect
      x="14"
      y="1"
      width="4"
      height="30"
      transform="translate(32) rotate(90)"
      fill="#b92932"
    ></rect>
    <path
      d="M28.222,4.21l-9.222,7.376v1.414h.75l9.943-7.94c-.419-.384-.918-.671-1.471-.85Z"
      fill="#b92932"
    ></path>
    <path
      d="M2.328,26.957c.414,.374,.904,.656,1.447,.832l9.225-7.38v-1.408h-.75L2.328,26.957Z"
      fill="#b92932"
    ></path>
    <path
      d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
      opacity=".15"
    ></path>
    <path
      d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z"
      fill="#fff"
      opacity=".2"
    ></path>
  </svg>
);

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "tr" ? "en" : "tr")}
      className="flex items-center gap-2 h-9 px-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
      aria-label="Toggle Language"
    >
      <div className="flex items-center gap-1.5 leading-none">
        <div
          className={`transition-all duration-300 ${language === "tr" ? "opacity-100 scale-110" : "opacity-30 blur-[0.5px] scale-90"}`}
        >
          <TRFlag />
        </div>
        <div className="w-px h-3 bg-border/50" />
        <div
          className={`transition-all duration-300 ${language === "en" ? "opacity-100 scale-110" : "opacity-30 blur-[0.5px] scale-90"}`}
        >
          <ENFlag />
        </div>
      </div>
    </Button>
  );
}
