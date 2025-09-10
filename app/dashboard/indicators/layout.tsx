import { ReactNode } from "react";

const IndicatorLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="w-full min-h-screen">
      {children}
    </main>
  );
};

export default IndicatorLayout;
