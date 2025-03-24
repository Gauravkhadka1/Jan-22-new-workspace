"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

const StarBackground = () => {
  const [stars, setStars] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      opacity: number;
      speed: number;
      direction: { x: number; y: number };
      isFastMoving?: boolean;
      lifespan?: number;
    }>
  >([]);

  useEffect(() => {
    // Create stars with movement parameters
    const newStars = [];
    const starCount = 300; // Increased number of stars
    
    // Regular stars (most will be small)
    for (let i = 0; i < starCount; i++) {
      const size = Math.random() > 0.9 ? Math.random() * 2 + 1.5 : Math.random() * 1.5; // 90% chance to be small
      const speed = size * 0.03; // Larger stars move slightly faster
      const angle = Math.random() * Math.PI * 2; // Random direction
      
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size,
        opacity: Math.random() * 0.6 + 0.2,
        speed: speed,
        direction: {
          x: Math.cos(angle),
          y: Math.sin(angle)
        }
      });
    }
    
    // Add some fast-moving large stars (these will move across the screen)
    const fastStarCount = 5;
    for (let i = 0; i < fastStarCount; i++) {
      const size = Math.random() * 3 + 2;
      const speed = size * 0.3; // Much faster speed
      // Start from edges and move inward
      const startFromEdge = Math.random() > 0.5;
      const angle = Math.random() * Math.PI * 2;
      
      newStars.push({
        id: starCount + i,
        x: startFromEdge ? (Math.random() > 0.5 ? 0 : 100) : Math.random() * 100,
        y: startFromEdge ? Math.random() * 100 : (Math.random() > 0.5 ? 0 : 100),
        size: size,
        opacity: Math.random() * 0.8 + 0.2,
        speed: speed,
        direction: {
          x: Math.cos(angle),
          y: Math.sin(angle)
        },
        isFastMoving: true,
        lifespan: Math.random() * 3000 + 2000 // 2-5 seconds lifespan
      });
    }
    
    setStars(newStars);

    // Animation loop
    let animationId: number;
    const animate = (timestamp: number) => {
      setStars(prevStars => 
        prevStars.map(star => {
          // Calculate new position
          let newX = star.x + star.direction.x * star.speed;
          let newY = star.y + star.direction.y * star.speed;
          
          if (star.isFastMoving) {
            // For fast moving stars, don't wrap around - just remove when off screen
            if (newX < -10 || newX > 110 || newY < -10 || newY > 110) {
              // Reset position to another edge
              const startFromEdge = Math.random() > 0.5;
              newX = startFromEdge ? (Math.random() > 0.5 ? -5 : 105) : Math.random() * 100;
              newY = startFromEdge ? Math.random() * 100 : (Math.random() > 0.5 ? -5 : 105);
              
              // New direction
              const angle = Math.random() * Math.PI * 2;
              return {
                ...star,
                x: newX,
                y: newY,
                direction: {
                  x: Math.cos(angle),
                  y: Math.sin(angle)
                },
                lifespan: Math.random() * 3000 + 2000
              };
            }
          } else {
            // Wrap around if star goes off screen (for regular stars)
            if (newX > 100) newX = 0;
            if (newX < 0) newX = 100;
            if (newY > 100) newY = 0;
            if (newY < 0) newY = 100;
          }
          
          return {
            ...star,
            x: newX,
            y: newY
          };
        })
      );
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)'
      }}
    >
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            boxShadow: star.isFastMoving 
              ? `0 0 ${star.size * 4}px ${star.size * 2}px rgba(255, 255, 255, ${star.opacity * 0.7})`
              : `0 0 ${star.size * 3}px ${star.size}px rgba(255, 255, 255, ${star.opacity * 0.5})`,
            transform: 'translateZ(0)', // Hardware acceleration
            transition: star.isFastMoving ? 'transform 10ms linear' : 'transform 50ms linear' // Faster transition for fast stars
          }}
        />
      ))}
    </div>
  );
};

const LoginForm = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Invalid credentials");
        setLoading(false);
        return;
      }
  
      const data = await response.json();
      login(data.token, data.user); 
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <>
      <StarBackground />
      <div className="flex items-center justify-center min-h-screen relative z-10">
        <div className="w-full max-w-md p-8 space-y-6 border border-gray-700 bg-dark-bg dark:bg-gray-800 shadow-lg rounded-xl backdrop-blur-sm bg-opacity-80">
          <img 
            src="https://pm-s3-images-webtech.s3.us-east-1.amazonaws.com/wtn-logo-white.webp" 
            alt="Company Logo" 
            className="mx-auto h-16"
          />
          <h2 className="text-2xl font-bold text-center text-gray-200 dark:text-gray-100">
            Login to Workspace
          </h2>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 mt-2 rounded-md border border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 mt-2 rounded-md border border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="Enter your password"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-gray-300 dark:text-gray-400">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 border-gray-600 rounded bg-gray-800 dark:bg-gray-700 dark:border-gray-600" 
                />
                <span className="ml-2">Remember Me</span>
              </label>
            </div>

            {/* Login Button */}
            <div>
              <button
                type="submit"
                className="w-full px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : "Login"}
              </button>
            </div>
          </form>

          {/* Sign Up Redirect */}
          {/* <p className="text-sm text-center text-gray-300 dark:text-gray-400">
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors">
              Sign Up
            </Link>
          </p> */}
        </div>
      </div>
    </>
  );
};

export default LoginForm;