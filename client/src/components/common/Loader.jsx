import React from "react";

export default function Loader({css}) {
  return (
    <div className={`flex items-center justify-center ${css}`}>
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent border-solid rounded-full animate-spin"></div>
    </div>
  );
}
