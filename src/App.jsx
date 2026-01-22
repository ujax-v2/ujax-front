// App.jsx
import React, { useState } from "react";
import SolveWireframeBase from "./SolveWireframeBase";
import SolutionsPage from "./SolutionsPage";

export default function App() {
  const [page, setPage] = useState("solve"); // 'solve' | 'solutions'

  return page === "solve" ? (
    <SolveWireframeBase
      onBack={() => console.log("back")}
      onOpenSolutions={() => setPage("solutions")}
    />
  ) : (
    <SolutionsPage onBack={() => setPage("solve")} />
  );
}
