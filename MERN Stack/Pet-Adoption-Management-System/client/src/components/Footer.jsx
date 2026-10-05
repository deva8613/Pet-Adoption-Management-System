import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Heart, ShieldCheck, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="paw-footer-wrapper">
      <div className="container paw-footer-container">
        {/* Left Column: Brand & Tagline */}
        <div className="paw-footer-brand-col">
          <Link to="/home" className="paw-footer-logo">
            <span className="paw-footer-icon">🐾</span>
            <span className="paw-footer-title">PawHomes</span>
          </Link>
          <p className="paw-footer-motto">
            Helping pets find their forever homes.
          </p>
          <p className="paw-footer-desc">
            Connecting loving individuals and families with rescued companions from verified animal shelters.
          </p>
        </div>

        {/* Links Column 1: Explore */}
        <div className="paw-footer-nav-col">
          <h4 className="paw-footer-heading">Explore</h4>
          <ul className="paw-footer-links-list">
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/pets">Find Pets</Link></li>
            <li><Link to="/favorites">Favorites</Link></li>
            <li><Link to="/rescue">Rescue</Link></li>
          </ul>
        </div>

        {/* Links Column 2: Account */}
        <div className="paw-footer-nav-col">
          <h4 className="paw-footer-heading">Account</h4>
          <ul className="paw-footer-links-list">
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/applications">Applications</Link></li>
            <li><Link to="/home">Notifications</Link></li>
          </ul>
        </div>

        {/* Links Column 3: Shelters */}
        <div className="paw-footer-nav-col">
          <h4 className="paw-footer-heading">Shelters</h4>
          <ul className="paw-footer-links-list">
            <li><Link to="/shelter/register">Shelter Registration</Link></li>
            <li><Link to="/login">Shelter Login</Link></li>
          </ul>
        </div>

        {/* Links Column 4: Support */}
        <div className="paw-footer-nav-col">
          <h4 className="paw-footer-heading">Support</h4>
          <ul className="paw-footer-links-list">
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/about">Help</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar: Copyright */}
      <div className="paw-footer-bottom-bar">
        <div className="container paw-footer-bottom-content">
          <p className="mb-0">
            © PawHomes. Pet Adoption Management System.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
