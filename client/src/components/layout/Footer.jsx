import React from "react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-background-secondary py-8 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
      <p>© 2026 SkillSwap AI. Campus skill exchange powered by time credits.</p>
      <div className="flex items-center gap-4">
        <Link to="/discover" className="hover:text-text-secondary transition-colors">Discover</Link>
        <Link to="/wallet" className="hover:text-text-secondary transition-colors">Wallet</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
