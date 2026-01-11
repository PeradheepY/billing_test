import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#1e3a5f] text-white no-print">
      <div className="container mx-auto px-4 lg:px-20 py-12 no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-2xl font-bold text-white">Bill<span className="text-orange-500">Master</span></span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              Your complete billing and invoicing solution. Streamline your business operations with powerful tools for inventory, sales, and customer management.
            </p>
            <div className="flex items-center space-x-3">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center transition-all">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center transition-all">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center transition-all">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center transition-all">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center transition-all">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-white/80 hover:text-orange-500 transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-white/80 hover:text-orange-500 transition-colors text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-white/80 hover:text-orange-500 transition-colors text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white/80 hover:text-orange-500 transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/80 hover:text-orange-500 transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#features" className="text-white/80 hover:text-orange-500 transition-colors text-sm">
                  Invoicing & Billing
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-white/80 hover:text-orange-500 transition-colors text-sm">
                  Inventory Management
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-white/80 hover:text-orange-500 transition-colors text-sm">
                  Customer Management
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-white/80 hover:text-orange-500 transition-colors text-sm">
                  Sales Reports
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-white/80 hover:text-orange-500 transition-colors text-sm">
                  Credit & Payments
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <a href="mailto:support@billmaster.pro" className="text-white/80 hover:text-orange-500 transition-colors text-sm">
                  support@billmaster.pro
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="text-white/80 text-sm">
                  <div>+44 7438823475</div>
                  <div>+91 9942576886</div>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-white/80 text-sm">
                  123 Business Avenue,<br />Tech District, City 12345
                </span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-20 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-white/80">
              &copy; {new Date().getFullYear()} BillMaster Pro. All Rights Reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-white/80 hover:text-orange-500 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-white/80 hover:text-orange-500 transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/support" className="text-white/80 hover:text-orange-500 transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
