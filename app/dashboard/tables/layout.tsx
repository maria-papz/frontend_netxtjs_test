import { ReactNode } from "react";

const TableLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="w-full min-h-screen">
      {children}
    </main>
  );
};

export default TableLayout;
