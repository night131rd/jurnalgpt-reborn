"use client";

import { useEffect, useRef } from "react";

export default function HeroBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Resize canvas
        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener("resize", resize);
        resize();

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;
            alpha: number;

            constructor() {
                this.x = width / 2; // Start from center
                this.y = height / 2;
                this.size = Math.random() * 2 + 1; // Randomized size
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 2 + 0.5;
                this.speedX = Math.cos(angle) * speed;
                this.speedY = Math.sin(angle) * speed;
                // Blue/Purple/Cyan theme
                const colors = ["#3b82f6", "#8b5cf6", "#06b6d4"];
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.alpha = Math.random() * 0.5 + 0.1;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.alpha -= 0.002; // Fade out slowly
            }

            draw() {
                if (!ctx) return;
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        const initParticles = () => {
            // Add a few particles every frame
            if (particles.length < 200) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Randomly spawn new particles for the continuous burst effect
            if (Math.random() < 0.1) {
                particles.push(new Particle());
                particles.push(new Particle());
            }

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                // Remove dead particles
                if (particles[i].alpha <= 0 ||
                    particles[i].x < 0 || particles[i].x > width ||
                    particles[i].y < 0 || particles[i].y > height) {
                    particles.splice(i, 1);
                    i--;
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 h-full w-full opacity-60 pointer-events-none"
        />
    );
}
