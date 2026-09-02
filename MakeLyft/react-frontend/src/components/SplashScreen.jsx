import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car } from "lucide-react";

const SplashScreen = () => {
	const navigate = useNavigate();
	const [fadeOut, setFadeOut] = useState(false);

	useEffect(() => {
		// Slower animation, fade out starts around 6.5s
		const fadeOutTimer = setTimeout(() => {
			setFadeOut(true);
		}, 6500);

		// Navigate to auth portal after fade out
		const navTimer = setTimeout(() => {
			navigate("/auth", { replace: true });
		}, 7500);

		return () => {
			clearTimeout(fadeOutTimer);
			clearTimeout(navTimer);
		};
	}, [navigate]);

	return (
		<div
			className={`fixed inset-0 bg-gradient-to-br from-[#714B67] via-[#5c3c54] to-[#392433] flex flex-col items-center justify-center transition-opacity duration-1000 z-50 ${
				fadeOut ? "opacity-0" : "opacity-100"
			}`}
		>
			<style>{`
        @keyframes driveCar {
          0% {
            transform: translateX(120vw);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(-120vw);
            opacity: 0;
          }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; transform: scaleX(1); }
          50% { opacity: 0.6; transform: scaleX(0.8); }
        }
        .animate-drive {
          animation: driveCar 7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-thrust {
          animation: flicker 0.1s infinite alternate;
        }
      `}</style>

			{/* Background Decals for realism */}
			<div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
			<div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00A09D]/10 rounded-full blur-3xl pointer-events-none"></div>

			<div className="text-center px-4 w-full relative h-screen flex flex-col items-center justify-center overflow-hidden">
				{/* Car and Road - Positioned MUCH HIGHER above text */}
				<div className="absolute top-[20%] left-0 right-0 h-32 w-full flex items-center justify-center">
					{/* Road line with glow */}
					<div className="w-full absolute bottom-4 h-0.5 bg-linear-to-r from-transparent via-white/40 to-transparent rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] z-0" />

					{/* Car element (Icon type) */}
					<div className="absolute animate-drive z-10 bottom-2 flex items-center justify-center">
						{/* Rocket Thrust Flame Effect */}
						<div className="absolute right-[-70px] top-[45%] h-[8px] w-[80px] bg-gradient-to-l from-transparent via-orange-500 to-yellow-100 rounded-full blur-[2px] animate-thrust z-0" />

						<Car
							size={96}
							strokeWidth={1.2}
							className="text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] -scale-x-100 relative z-10"
						/>
					</div>
				</div>

				{/* Text Content - Positioned BELOW car */}
				<div className="absolute bottom-[40%] z-20 w-full px-4 font-sans">
					<h1 className="text-white text-2xl md:text-4xl font-light drop-shadow-lg max-w-2xl mx-auto text-center leading-relaxed tracking-wide">
						Lyft up your travel mood with{" "}
						<span className="text-teal-300 font-semibold">MakeLyft</span>
					</h1>
					<p className="text-purple-200/80 mt-4 text-xs md:text-sm font-light tracking-[0.2em] uppercase">
						Your premium commuting experience
					</p>
				</div>
			</div>
		</div>
	);
};

export default SplashScreen;
