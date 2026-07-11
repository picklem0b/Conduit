import { useEffect, useRef } from "react";

interface LogoProps {
    size?: number;
    animate?: boolean;
    withText?: boolean;
    textSize?: number;
}

export function Logo({
    size = 40,
    animate = true,
    withText = false,
    textSize = 28
}: LogoProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!animate || !svgRef.current) return;
        const paths = svgRef.current.querySelectorAll<
            SVGPathElement | SVGLineElement
        >("path, line");
        paths.forEach(p => {
            const len = (p as SVGGeometryElement).getTotalLength?.() ?? 200;
            p.style.strokeDasharray = String(len);
            p.style.strokeDashoffset = String(len);
            p.style.transition = "none";
        });

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                paths.forEach((p, i) => {
                    p.style.transition = `stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1) ${i * 0.08}s`;
                    p.style.strokeDashoffset = "0";
                });
            });
        });
    }, [animate]);

    // ViewBox: 0 0 80 60
    // Three input lines from left, converge to center gate (vertical bar at x=48),
    // single output line exits right — exactly matching the reference logo.
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: withText ? 12 : 0
            }}
        >
            <svg
                ref={svgRef}
                width={size}
                height={size * 0.75}
                viewBox="0 0 80 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Conduit logo"
            >
                {/* Top input line — curves down to gate */}
                <path
                    d="M4 14 H28 Q44 14 44 30"
                    stroke="white"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Middle input line — goes straight through */}
                <path
                    d="M4 30 H44"
                    stroke="white"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                />
                {/* Bottom input line — curves up to gate */}
                <path
                    d="M4 46 H28 Q44 46 44 30"
                    stroke="white"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Vertical gate bar */}
                <line
                    x1="48"
                    y1="10"
                    x2="48"
                    y2="50"
                    stroke="white"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                />

                {/* Output line — single unified line exits right */}
                <path
                    d="M48 30 H76"
                    stroke="white"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                />
            </svg>

            {withText && (
                <span
                    style={{
                        fontSize: textSize,
                        fontWeight: 300,
                        color: "#ffffff",
                        letterSpacing: "-0.02em",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        lineHeight: 1
                    }}
                >
                    Conduit
                </span>
            )}
        </div>
    );
}

// Favicon-sized mark (no animation, no text)
export function LogoMark({ size = 20 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size * 0.75}
            viewBox="0 0 80 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Conduit"
        >
            <path
                d="M4 14 H28 Q44 14 44 30"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M4 30 H44"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M4 46 H28 Q44 46 44 30"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="48"
                y1="10"
                x2="48"
                y2="50"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M48 30 H76"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}
