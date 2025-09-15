import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Features from "./Features";
import About from "./About";
import Services from "./Services";
import Reviews from "./Reviews";
import DesignersForm from "./DesignersForm";
import Footer from "./Footer";
import Products from "./Products";
import Contact from "./Contact";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero />
              <Features />
              <Reviews />
              <Footer />
            </>
          }
        />
        <Route path="/rugs" element={<Products />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/designers" element={<DesignersForm />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}

export default App;

