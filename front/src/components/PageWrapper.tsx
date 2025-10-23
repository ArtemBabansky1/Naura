import React from "react";
import { isMobileOnly } from "react-device-detect";
import cn from "classnames";

export const PageWrapper = ({
  children,
  contentClassName,
  wrapperClassName,
  styles,
}: {
  children: React.ReactNode;
  contentClassName?: string;
  wrapperClassName?: string;
  styles?: React.CSSProperties;
}) => {
  return (
    <div
      className={cn(
        "max-w-5xl mx-auto px-4 py-6 relative z-10",
        isMobileOnly ? "!p-2" : "",
        contentClassName
      )}
      style={styles}
    >
      {children}
    </div>
  );
};
