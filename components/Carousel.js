"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css"; 
import "swiper/css/navigation"; 
import "swiper/css/pagination"; 

import { Button } from "@/components/ui/button"; // Example of a button from ShadCN UI
import { ChevronLeft, ChevronRight } from "lucide-react"; // Optional icons for navigation

const Carousel = () => {
  return (
    <div className="max-w-4xl mx-auto mt-10">
      {/* Swiper Carousel */}
      <Swiper
        spaceBetween={50} // Space between slides
        slidesPerView={1} // Number of slides visible at once
        loop={true} // Enable looping
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        }}
        pagination={{ clickable: true }} // Enable clickable pagination
      >
        <SwiperSlide>
          <div className="relative h-80 bg-gray-200 rounded-lg shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
              alt="Invoicing"
              className="object-cover w-full h-full rounded-lg"
            />
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div className="relative h-80 bg-gray-200 rounded-lg shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80"
              alt="Inventory"
              className="object-cover w-full h-full rounded-lg"
            />
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div className="relative h-80 bg-gray-200 rounded-lg shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
              alt="Analytics"
              className="object-cover w-full h-full rounded-lg"
            />
          </div>
        </SwiperSlide>
      </Swiper>

      {/* Custom Navigation Buttons using ShadCN Button */}
      <div className="flex justify-between mt-4">
        <Button variant="outline" className="swiper-button-prev">
          <ChevronLeft />
          Prev
        </Button>
        <Button variant="outline" className="swiper-button-next">
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
};

export default Carousel;
