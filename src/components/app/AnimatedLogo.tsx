
"use client";

import React, { useState } from 'react';

// SVG icon size decreased to ~70%
const ShopIcon = () => (
    <svg width="34" height="28" viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        {/* Shop Awning */}
        <path d="M2 12 C 2 6, 30 6, 30 12 L 30 16 L 2 16 L 2 12 Z" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M6 16V12" stroke="currentColor" strokeWidth="2" />
        <path d="M12 16V12" stroke="currentColor" strokeWidth="2" />
        <path d="M18 16V12" stroke="currentColor" strokeWidth="2" />
        <path d="M24 16V12" stroke="currentColor" strokeWidth="2" />
        {/* Shop Body */}
        <path d="M2 16 H 30 V 36 H 2 Z" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M10 36 V 24 H 22 V 36" stroke="currentColor" strokeWidth="2" fill="none" />
        {/* Tablet */}
        <rect x="28" y="14" width="30" height="26" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M38 36 H 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
         {/* Arrow */}
        <path d="M25 27 L 44 27" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M40 23 L 44 27 L 40 31" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
);

const AnimatedLogo = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [animationKey, setAnimationKey] = useState(0); // To re-trigger animation
    const line1 = "Kundan";
    const line2 = "Mart";

    const handleMouseEnter = () => {
        setAnimationKey(prevKey => prevKey + 1); // Ensures animation restarts on every hover
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <div 
            onMouseEnter={handleMouseEnter} 
            onMouseLeave={handleMouseLeave} 
            className="h-10 flex items-center justify-center cursor-pointer"
            style={{ width: '50px' }} // Fixed width to prevent layout shift
        >
            {isHovered ? (
                <div key={animationKey} className="flex flex-col text-[9px] font-bold text-primary leading-tight">
                    <div className="whitespace-nowrap">
                        {line1.split('').map((char, index) => (
                            <span
                                key={`1-${index}`}
                                className="animate-pop-in"
                                style={{
                                    animationDelay: `${index * 80}ms`,
                                    opacity: 0,
                                }}
                            >
                                {char}
                            </span>
                        ))}
                    </div>
                    <div className="whitespace-nowrap">
                        {line2.split('').map((char, index) => (
                            <span
                                key={`2-${index}`}
                                className="animate-pop-in"
                                style={{
                                    animationDelay: `${(line1.length + index) * 80}ms`,
                                    opacity: 0,
                                }}
                            >
                                {char}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <ShopIcon />
            )}
        </div>
    );
};

export default AnimatedLogo;
