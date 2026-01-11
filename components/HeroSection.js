"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
      title: "Smart Invoicing",
      subtitle: "Create professional invoices in seconds with automated calculations",
    },
    {
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
      title: "Inventory Management",
      subtitle: "Track stock levels in real-time and never run out of products",
    },
    {
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      title: "Sales Analytics",
      subtitle: "Gain insights with powerful reports and dashboards",
    },
  ];

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="bg-[#f5f5f0] py-12 lg:py-20 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Content */}
          <div className="space-y-6 lg:space-y-8">
            <div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                Simplify Your Business With{" "}
                <span className="text-orange-500">BillMaster Pro</span>
                {" "}- All-In-One Billing Solution
              </h1>
            </div>
            
            <p className="text-gray-600 text-lg lg:text-xl">
              Complete billing and invoicing solution for any business. Manage inventory, sales, customers, and payments efficiently.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/userlogin">
                <button className="relative inline-flex items-center justify-center px-8 py-6 overflow-hidden tracking-tighter text-white bg-[#2c3e5f] rounded-md group font-semibold text-lg shadow-lg">
                  <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-orange-500 rounded-full group-hover:w-72 group-hover:h-72"></span>
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
                  <span className="relative flex items-center gap-2">
                    Request Free Trial
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </button>
              </Link>
              <button className="relative inline-flex items-center justify-center px-8 py-6 overflow-hidden tracking-tighter text-orange-500 bg-white border-2 border-orange-500 rounded-md group font-semibold text-lg">
                <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-orange-500 rounded-full group-hover:w-72 group-hover:h-72"></span>
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
                <span className="relative flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                  Learn More
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
            </div>
          </div>

          {/* Right Image Section with Carousel */}
          <div className="relative">
            {/* Orange curved shape background */}
            <div className="absolute inset-0 bg-orange-500 rounded-br-[200px] lg:rounded-br-[300px] -right-10 lg:-right-20 top-0 z-0 transform scale-105"></div>
            
            {/* Carousel Container */}
            <div className="relative z-10 rounded-br-[200px] lg:rounded-br-[300px] overflow-hidden shadow-2xl">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`transition-opacity duration-700 ease-in-out ${
                    currentSlide === index ? "opacity-100" : "opacity-0 absolute inset-0"
                  }`}
                >
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    width={800}
                    height={600}
                    className="w-full h-[400px] lg:h-[500px] xl:h-[600px] object-cover"
                    priority={index === 0}
                  />
                  {/* Overlay with text */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h3 className="text-white text-2xl font-bold mb-2">{slide.title}</h3>
                    <p className="text-white/90 text-sm">{slide.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button 
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <button 
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>

            {/* Slide Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentSlide === index 
                      ? "bg-white w-8" 
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
