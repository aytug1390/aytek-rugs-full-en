import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import AllRugs from "@/pages/AllRugs";
import CategoryProducts from "@/pages/CategoryProducts";
import Navbar from "@/components/Navbar";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/all-rugs" element={<AllRugs />} />
        <Route path="/category/:slug" element={<CategoryProducts />} />
      </Routes>
    </BrowserRouter>
  );
}
import TestHooks from "./TestHooks";

export default function App() {
  return <TestHooks />;
}