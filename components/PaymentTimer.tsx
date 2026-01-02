"use client";

import { useEffect, useState } from 'react';

interface PaymentTimerProps {
    /** Countdown duration in seconds */
    duration: number;
    /** Callback when timer reaches zero */
    onExpire?: () => void;
}

export default function PaymentTimer({ duration, onExpire }: PaymentTimerProps) {
    const [secondsLeft, setSecondsLeft] = useState(duration);

    useEffect(() => {
        if (secondsLeft <= 0) {
            onExpire?.();
            return;
        }
        const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
        return () => clearTimeout(timer);
    }, [secondsLeft, onExpire]);

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    // Circle calculations
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (secondsLeft / duration) * circumference;

    return (
        <div className="relative flex items-center justify-center w-18 h-18 md:w-28 md:h-28">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    className="stroke-zinc-100 fill-none"
                    strokeWidth="2"
                />
                {/* Progress Circle */}
                <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    className="stroke-black fill-none transition-all duration-1000 ease-linear"
                    strokeWidth="2"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>

            {/* Time Text */}
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[24px] font-bold text-zinc-900 tabular-nums tracking-tight">
                    {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
            </div>
        </div>
    );
}
