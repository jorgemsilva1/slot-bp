import React, { useMemo } from 'react';

interface CoinConfig {
    src: string;
    size: number;
    left: number;
    duration: number;
    delay: number;
}

interface FallingCoinsProps {
    /** Array of coin image URLs (4 images) */
    coinSrcs: string[];
    /** Number of coins to spawn */
    coinCount?: number;
    /** Base duration of fall animation in seconds */
    duration?: number;
}

/**
 * FallingCoins component
 * Renders coins falling from the top, full-screen fixed overlay
 */
const FallingCoins: React.FC<FallingCoinsProps> = ({
                                                       coinSrcs,
                                                       coinCount = 20,
                                                       duration = 2,
                                                   }) => {
    // Generate random coin configs once
    const coins: CoinConfig[] = useMemo(() => {
        const arr: CoinConfig[] = [];
        for (let i = 0; i < coinCount; i++) {
            arr.push({
                src: coinSrcs[Math.floor(Math.random() * coinSrcs.length)],
                size: 100 + Math.random() * 60, // size between 20-50px
                left: Math.random() * 100,      // percentage across viewport
                duration: duration * (0.5 + Math.random() * 0.4), // ±20%
                delay: Math.random() * duration,
            });
        }
        return arr;
    }, [coinCount, coinSrcs, duration]);

    return (
        <div
            style={{
                position: 'fixed',
                top: -200,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 999999999,
            }}
        >
            <style>{`
        @keyframes fall {
          0% { transform: translateY(-50px); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        .coin {
          position: absolute;
          top: 0;
          will-change: transform, opacity;
        }
      `}</style>

            {coins.map((coin, idx) => (
                <img
                    key={idx}
                    className="coin"
                    src={coin.src}
                    alt="coin"
                    style={{
                        left: `${coin.left}%`,
                        width: `${coin.size}px`,
                        height: `${coin.size}px`,
                        animation: `fall ${coin.duration}s ease-in ${coin.delay}s forwards`,
                    }}
                />
            ))}
        </div>
    );
};

export default FallingCoins;
