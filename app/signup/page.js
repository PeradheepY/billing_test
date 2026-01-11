"use client";

import { useState } from "react";
import { UserRegister } from "../action/SignupAction";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import { Eye, EyeOff, FileText, PieChart, DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";
import Image from "next/image";

export default function UserForm() {
  const [message, setMessage] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    const result = await UserRegister(formData);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }

    setTimeout(() => {
      setMessage(null);
    }, 2000);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
        {/* Decorative Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-blue-200/40 rounded-full blur-3xl"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/50">
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Join Our Community
              </h1>
              <p className="text-gray-600 text-sm">
                Create your account to get started
              </p>
            </div>

            <form action={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-400"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-400"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-400"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms & Conditions */}
              {/* <div className="flex items-start">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="font-medium text-gray-900 hover:text-green-600">
                    Terms and Conditions
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="font-medium text-gray-900 hover:text-green-600">
                    Privacy Policy
                  </Link>
                </label>
              </div> */}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-black hover:bg-gray-900 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Create Account'
                )}
              </button>

              {/* Google Sign Up */}
              {/* <button
                type="button"
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-300 border border-gray-300 flex items-center justify-center gap-2 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button> */}

              {/* Sign In Link */}
              <div className="text-center text-gray-600 pt-2">
                <p className="text-sm">
                  Already have an account?{' '}
                  <Link 
                    href="/userlogin" 
                    className="font-semibold text-gray-900 hover:text-green-600"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-100 via-yellow-100 to-orange-100 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative Blobs */}
        <div className="absolute top-10 left-10 w-48 h-48 bg-green-200/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-yellow-200/50 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-orange-200/50 rounded-full blur-3xl"></div>
        
        {/* Business Illustration */}
        <div className="relative z-10 w-full max-w-xl">
          <div className="relative">
            {/* Main Image Container */}
            <div className="relative flex items-center justify-center">
              <Image
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80"
                alt="Business Analytics"
                width={500}
                height={500}
                className="rounded-3xl shadow-2xl object-cover"
              />
              
              {/* Floating Elements */}
              <div className="absolute -top-10 left-0 bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl transform -rotate-6 animate-float border border-orange-100">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 mb-2">
                    <FileText className="w-7 h-7 text-orange-600" strokeWidth={2.5} />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">Invoicing</p>
                </div>
              </div>
              
              <div className="absolute top-20 -right-10 bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl transform rotate-6 animate-float delay-100 border border-cyan-100">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-50 mb-2">
                    <PieChart className="w-7 h-7 text-cyan-600" strokeWidth={2.5} />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">Analytics</p>
                </div>
              </div>
              
              <div className="absolute -bottom-10 right-1/4 bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl transform -rotate-3 animate-float delay-200 border border-yellow-100">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-50 mb-2">
                    <DollarSign className="w-7 h-7 text-yellow-600" strokeWidth={2.5} />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">Payments</p>
                </div>
              </div>
            </div>
            
            {/* Features at Bottom */}
            <div className="mt-8 flex justify-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/90 shadow-lg animate-bounce delay-100">
                <ShoppingCart className="w-10 h-10 text-amber-600" strokeWidth={2} />
              </div>
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/90 shadow-lg animate-bounce delay-200">
                <Users className="w-10 h-10 text-pink-600" strokeWidth={2} />
              </div>
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/90 shadow-lg animate-bounce delay-300">
                <TrendingUp className="w-10 h-10 text-green-600" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}
