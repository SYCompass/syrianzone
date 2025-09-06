"use client";

import React, { useEffect } from "react";

export default function CustomNavBar(): React.ReactElement | null {
  useEffect(() => {
    import("./navbar-element");
  }, []);

  return React.createElement("nav-bar");
}


