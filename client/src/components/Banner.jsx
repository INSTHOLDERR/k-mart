import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { assets } from "../assets/assets";

const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Banner data array - customize these for each banner
  const banners = [
    {
      id: 1,
      desktopImg: assets.banner1,
      mobileImg: assets.banner1,
      title: "Freshness You Can Trust, Savings You will Love!",
      primaryBtn: "Shop Now",
      secondaryBtn: "Explore Deals"
    },
    {
      id: 2,
      desktopImg: assets.banner2, // Replace with your second banner image
      mobileImg: assets.banner2, // Replace with your second mobile banner
      title: "Discover Amazing Deals on Fresh Products!",
      primaryBtn: "Shop Now",
      secondaryBtn: "View Offers"
    },
    {
      id: 3,
      desktopImg: assets.banner3, // Replace with your third banner image
      mobileImg: assets.banner3, // Replace with your third mobile banner
      title: "Quality Products at Unbeatable Prices!",
      primaryBtn: "Shop Now",
      secondaryBtn: "Browse All"
    }
  ];

  // Auto-play slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  // Manual navigation
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="relative overflow-hidden w-full">
      {/* Maintain aspect ratio: 2366 / 848 = 2.79:1 ratio */}
      <div className="relative w-full" style={{ paddingBottom: '35.84%' }}>
        {/* Slides Container */}
        <div
          className="absolute inset-0 flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={banner.id} className="min-w-full relative h-full">
              {/* Desktop Image */}
              <img
                src={banner.desktopImg}
                alt={`Banner ${index + 1}`}
                className="hidden md:block w-full h-full object-cover"
              />
              {/* Mobile Image - different aspect ratio */}
              <img
                src={banner.mobileImg}
                alt={`Banner ${index + 1}`}
                className="md:hidden w-full h-full object-cover"
              />
              
              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col items-center md:items-start justify-end md:justify-center pb-16 sm:pb-20 md:pb-0 px-4 md:px-12 lg:px-20 xl:px-24">
                <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-center md:text-left max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl leading-tight text-white drop-shadow-lg">
                  {banner.title}
                </h1>
                <div className="flex items-center mt-4 md:mt-6 font-medium gap-3 sm:gap-4 md:gap-6">
                  <Link
                    to={"/products"}
                    className="flex group items-center gap-2 px-5 sm:px-6 md:px-7 rounded text-white py-2.5 sm:py-3 bg-red-700 hover:bg-red-700/90 transition text-sm sm:text-base"
                  >
                    {banner.primaryBtn}
                    <img
                      src={assets.white_arrow_icon}
                      alt="arrow"
                      className="w-4 h-4 transition group-hover:translate-x-1"
                    />
                  </Link>
                  <Link
                    to={"/products"}
                    className="hidden md:flex group items-center gap-2 px-5 sm:px-6 md:px-7 rounded text-white py-2.5 sm:py-3 bg-red-700 hover:bg-red-700/90 transition text-sm sm:text-base"
                  >
                    {banner.secondaryBtn}
                    <img
                      src={assets.white_arrow_icon}
                      alt="arrow"
                      className="w-4 h-4 transition group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 sm:p-2 md:p-3 rounded-full shadow-lg transition z-10 backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Next Button */}
        <button
          onClick={goToNext}
          className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 sm:p-2 md:p-3 rounded-full shadow-lg transition z-10 backdrop-blur-sm"
          aria-label="Next slide"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Dots Navigation */}
        <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 sm:h-2.5 md:h-3 rounded-full transition-all ${
                currentSlide === index
                  ? "bg-primary w-6 sm:w-7 md:w-8"
                  : "bg-white/60 hover:bg-white/80 w-2 sm:w-2.5 md:w-3"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Banner;