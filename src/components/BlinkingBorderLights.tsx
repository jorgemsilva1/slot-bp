import React, { useRef, useEffect, useState } from 'react';

interface LightPoint {
    x: number;
    y: number;
    delay: number;
    radius: number;
}

interface BlinkingBorderLightsProps {
    width?: number;
    height?: number;
    lightCount?: number;
    baseRadius?: number;
    animationDuration?: number;
    glowStdDev?: number;
    orderly?: boolean; // true for rotating chase, false for random blink
}

/**
 * BlinkingBorderLights React component
 * Adds glowing lights along an SVG border
 * Props:
 * - orderly: if true, lights blink in sequence around border; if false, random blink
 */
const BlinkingBorderLights: React.FC<BlinkingBorderLightsProps> = ({
                                                                       width = 1200,
                                                                       height = 727.5,
                                                                       lightCount = 30,
                                                                       baseRadius = 20,
                                                                       animationDuration = 1,
                                                                       glowStdDev = 32,
                                                                       orderly = true,
                                                                   }) => {
    const pathRef = useRef<SVGPathElement | null>(null);
    const [points, setPoints] = useState<LightPoint[]>([]);

    useEffect(() => {
        const path = pathRef.current;
        if (!path) return;
        const totalLength = path.getTotalLength();
        const pts: LightPoint[] = [];

        // compute delay step for orderly chase
        const step = animationDuration / lightCount;

        for (let i = 0; i < lightCount; i++) {
            const pos = path.getPointAtLength((i / lightCount) * totalLength);
            const radius = baseRadius * (0.7 + Math.random() * 0.6);
            let delay: number;
            if (orderly) {
                // sequential delays: rotate around
                delay = i * step;
            } else {
                // random delay
                delay = Math.random() * animationDuration;
            }
            pts.push({ x: pos.x, y: pos.y, delay, radius });
        }
        setPoints(pts);
    }, [lightCount, animationDuration, baseRadius, orderly]);

    return (
        <>
            <style>{`
        @keyframes glow {
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 1;   }
        }
        .light {
          fill: white;
          filter: url(#glow-filter);
          animation: glow ${animationDuration}s infinite ease-in-out;
        }
      `}</style>

            <svg
                width={width}
                height={height}
                viewBox="0 0 1489.87 901.88"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <filter id="glow-filter" filterUnits="userSpaceOnUse" x="-75%" y="-75%" width="250%" height="250%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation={glowStdDev / 2} result="blur1" />
                        <feGaussianBlur in="blur1" stdDeviation={glowStdDev} result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <style>{`
            .cls-1 {
              fill: none;
              stroke: #e45525;
              stroke-miterlimit: 10;
              stroke-width: 93.25px;
            }
            .cls-2 {
              fill: #f2ad25;
            }
          `}</style>
                </defs>

                <g id="Art">
                    <path
                        className="cls-2"
                        d="M54.59,831.46c-1.31,11.99,7.48,21.43,19.54,20.98l1343.89-50.37c12.05-.45,21.22-10.67,20.36-22.7l-43.87-616.78c-.86-12.03-11.4-22.59-23.43-23.46L161.82,51.35c-12.03-.87-22.95,8.22-24.25,20.21L54.59,831.46Z"
                    />
                    <path
                        className="cls-1"
                        ref={pathRef}
                        d="M54.59,831.46c-1.31,11.99,7.48,21.43,19.54,20.98l1343.89-50.37c12.05-.45,21.22-10.67,20.36-22.7l-43.87-616.78c-.86-12.03-11.4-22.59-23.43-23.46L161.82,51.35c-12.03-.87-22.95,8.22-24.25,20.21L54.59,831.46Z"
                    />
                </g>

                <g id="lights">
                    {points.map((pt, idx) => (
                        <circle
                            key={idx}
                            className="light"
                            cx={pt.x}
                            cy={pt.y}
                            r={pt.radius}
                            style={{ animationDelay: `${pt.delay.toFixed(2)}s` }}
                        />
                    ))}
                </g>
            </svg>
        </>
    );
};

export default BlinkingBorderLights;