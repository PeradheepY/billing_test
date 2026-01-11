"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Mail, Phone, Facebook, Instagram, Youtube, Twitter, Linkedin, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isActive = (path) => pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Features", path: "/#features" },
    { name: "Pricing", path: "/#pricing" },
    { name: "Contact Us", path: "/contact" }
  ];

  return (
    <>
      {/* Top Header Bar */}
      <div className={`bg-[#1e3a5f] text-white py-2 px-4 lg:px-20 no-print transition-all duration-300 ${isScrolled ? 'hidden' : 'block'}`}>
        <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center space-y-2 lg:space-y-0">
          {/* Contact Info */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start space-x-4 lg:space-x-6 text-sm">
            <a href="mailto:support@billmaster.pro" className="flex items-center space-x-2 hover:text-orange-400 transition-colors">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">support@billmaster.pro</span>
            </a>
            <a href="tel:+447438823475" className="flex items-center space-x-2 hover:text-orange-400 transition-colors">
              <Phone className="h-4 w-4" />
              <span>+44 7438823475</span>
            </a>
            <span className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>+91 9942576886</span>
            </span>
          </div>

          {/* Social Icons & Book Demo */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <a href="#" className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-orange-400 transition-all">
                <Facebook className="h-4 w-4 text-[#1e3a5f]" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-orange-400 transition-all">
                <Instagram className="h-4 w-4 text-[#1e3a5f]" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-orange-400 transition-all">
                <Youtube className="h-4 w-4 text-[#1e3a5f]" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-orange-400 transition-all">
                <Twitter className="h-4 w-4 text-[#1e3a5f]" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-orange-400 transition-all">
                <Linkedin className="h-4 w-4 text-[#1e3a5f]" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-orange-400 transition-all">
                <MapPin className="h-4 w-4 text-[#1e3a5f]" />
              </a>
            </div>
            <button className="relative inline-flex items-center justify-center px-4 py-1 overflow-hidden tracking-tighter text-white bg-orange-500 rounded-md group text-sm font-semibold">
              <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-[#1e3a5f] rounded-full group-hover:w-56 group-hover:h-56"></span>
              <span className="absolute bottom-0 left-0 h-full -ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-auto h-full opacity-100 object-stretch" viewBox="0 0 487 487">
                  <path fillOpacity=".1" fillRule="nonzero" fill="#FFF" d="M0 .3c67 2.1 134.1 4.3 186.3 37 52.2 32.7 89.6 95.8 112.8 150.6 23.2 54.8 32.3 101.4 61.2 149.9 28.9 48.4 77.7 98.8 126.4 149.2H0V.3z"></path>
                </svg>
              </span>
              <span className="absolute top-0 right-0 w-12 h-full -mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="object-cover w-full h-full" viewBox="0 0 487 487">
                  <path fillOpacity=".1" fillRule="nonzero" fill="#FFF" d="M487 486.7c-66.1-3.6-132.3-7.3-186.3-37s-95.9-85.3-126.2-137.2c-30.4-51.8-49.3-99.9-76.5-151.4C70.9 109.6 35.6 54.8.3 0H487v486.7z"></path>
                </svg>
              </span>
              <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-gray-200"></span>
              <span className="relative">Book a Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sticky top-0 z-50 bg-white shadow-lg no-print">
        <div className="container mx-auto px-4 lg:px-20">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">B</span>
                </div>
                <span className="text-2xl font-bold text-gray-800">Bill<span className="text-orange-500">Master</span></span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-gray-700 hover:text-orange-500 transition-colors duration-300 font-medium text-base ${
                    isActive(link.path) ? "text-orange-500" : ""
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Get Started Button - Desktop */}
            <div className="hidden lg:flex items-center">
              <Link href="/userlogin">
                <button className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden tracking-tighter text-white bg-orange-500 rounded-md group font-semibold text-base">
                  <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-[#1e3a5f] rounded-full group-hover:w-56 group-hover:h-56"></span>
                  <span className="absolute bottom-0 left-0 h-full -ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-auto h-full opacity-100 object-stretch" viewBox="0 0 487 487">
                      <path fillOpacity=".1" fillRule="nonzero" fill="#FFF" d="M0 .3c67 2.1 134.1 4.3 186.3 37 52.2 32.7 89.6 95.8 112.8 150.6 23.2 54.8 32.3 101.4 61.2 149.9 28.9 48.4 77.7 98.8 126.4 149.2H0V.3z"></path>
                    </svg>
                  </span>
                  <span className="absolute top-0 right-0 w-12 h-full -mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="object-cover w-full h-full" viewBox="0 0 487 487">
                      <path fillOpacity=".1" fillRule="nonzero" fill="#FFF" d="M487 486.7c-66.1-3.6-132.3-7.3-186.3-37s-95.9-85.3-126.2-137.2c-30.4-51.8-49.3-99.9-76.5-151.4C70.9 109.6 35.6 54.8.3 0H487v486.7z"></path>
                    </svg>
                  </span>
                  <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-gray-200"></span>
                  <span className="relative">Get Started</span>
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden focus:outline-none text-gray-700"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-8 w-8" />
              ) : (
                <Menu className="h-8 w-8" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50">
            <div className="container mx-auto px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={toggleMobileMenu}
                  className={`block text-gray-700 hover:text-orange-500 transition-colors duration-300 font-medium py-2 ${
                    isActive(link.path) ? "text-orange-500" : ""
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4">
                <Link href="/userlogin" onClick={toggleMobileMenu}>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-md transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}  