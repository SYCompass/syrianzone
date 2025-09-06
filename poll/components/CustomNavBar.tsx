"use client";

import React, { useEffect } from "react";

export default function CustomNavBar(): React.ReactElement | null {
  useEffect(() => {
    // Register the custom element within the poll app bundle
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    import("./navbar-element");
  }, []);

  return React.createElement("nav-bar");
}


