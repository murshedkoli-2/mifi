import * as React from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface LogoProps {
    width?: number;
    height?: number;
}

export default function Logo({ width = 80, height = 80 }: LogoProps) {
    return (
        <Svg width={width} height={height} viewBox="0 0 100 100" fill="none">
            <Defs>
                <LinearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#60A5FA" stopOpacity="1" />
                    <Stop offset="50%" stopColor="#A78BFA" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#818CF8" stopOpacity="1" />
                </LinearGradient>
            </Defs>

            {/* Outer circle */}
            <Circle cx="50" cy="50" r="45" fill="url(#coinGradient)" />

            {/* Inner circle - coin border */}
            <Circle cx="50" cy="50" r="38" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />

            {/* Dollar sign - top curve */}
            <Path
                d="M 42 35 Q 55 30, 58 38 Q 60 45, 50 48"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
            />

            {/* Dollar sign - bottom curve */}
            <Path
                d="M 50 52 Q 40 55, 42 62 Q 45 70, 58 65"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
            />

            {/* Dollar sign - vertical line */}
            <Path
                d="M 50 28 L 50 72"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
            />

            {/* Growth arrow */}
            <Path
                d="M 65 60 L 75 45 L 80 50"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <Path
                d="M 75 45 L 70 48"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </Svg>
    );
}
