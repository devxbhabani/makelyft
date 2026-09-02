import React, { useState } from "react";
import Login from "./Login";
import Signup from "./signup";
import { Car, Users, Leaf, Shield, CheckCircle2 } from "lucide-react";

function AuthPortal({ onLoginSuccess }) {
	const [currentView, setCurrentView] = useState("login"); // 'login', 'signup', 'success'
	const [userProfile, setUserProfile] = useState(null);

	const handleLogin = (profile) => {
		setUserProfile(profile);
		setCurrentView("success");
		onLoginSuccess?.(profile);
	};

	const handleSignup = (profile) => {
		setUserProfile(profile);
		setCurrentView("success");
		onLoginSuccess?.(profile);
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col md:flex-row w-full page-transition">
			{/* Left Panel: Content & Illustration (Odoo Themed) */}
			<div className="md:w-1/2 bg-[#714B67] text-white p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
				{/* Background shapes for depth */}
				<div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none"></div>
				{/* <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-[#00A09D]/20 rounded-full blur-3xl pointer-events-none"></div> */}

				{/* Brand */}
				<div className="flex items-center gap-3 relative z-10">
					<div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
						<Car className="w-6 h-6 text-white" />
					</div>
					<span className="text-xl font-bold tracking-wider">
						MakeLyft
					</span>
				</div>

				{/* Marketing / Value Prop */}
				<div className="my-auto py-12 space-y-8 relative z-10 max-w-lg">
					<div className="space-y-4">
						<span className="inline-block px-3 py-1 bg-[#00A09D] text-xs font-bold uppercase tracking-widest rounded-full">
							Enterprise Carpooling
						</span>
						<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
							Commute Together, Save Smarter.
						</h1>
						<p className="text-white/80 text-base leading-relaxed">
							Join Odoo's official carpooling ecosystem. Reduce commuting
							costs, reduce traffic congestion, and lower carbon
							footprint by sharing rides with verified colleagues.
						</p>
					</div>

					{/* Bullet points */}
					<div className="space-y-4">
						<div className="flex items-start gap-3">
							<div className="w-6 h-6 rounded-full bg-[#00A09D]/20 flex items-center justify-center shrink-0 border border-[#00A09D]/30 mt-0.5">
								<Users className="w-3.5 h-3.5 text-[#00A09D]" />
							</div>
							<div>
								<h3 className="font-semibold text-sm">
									Verified Co-workers Only
								</h3>
								<p className="text-xs text-white/70">
									Connect with employees from registered organizations.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="w-6 h-6 rounded-full bg-[#00A09D]/20 flex items-center justify-center shrink-0 border border-[#00A09D]/30 mt-0.5">
								<Leaf className="w-3.5 h-3.5 text-[#00A09D]" />
							</div>
							<div>
								<h3 className="font-semibold text-sm">
									Eco-Friendly Commutes
								</h3>
								<p className="text-xs text-white/70">
									Contribute to organizational sustainability goals.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="w-6 h-6 rounded-full bg-[#00A09D]/20 flex items-center justify-center shrink-0 border border-[#00A09D]/30 mt-0.5">
								<Shield className="w-3.5 h-3.5 text-[#00A09D]" />
							</div>
							<div>
								<h3 className="font-semibold text-sm">
									Real-time Ride Tracking
								</h3>
								<p className="text-xs text-white/70">
									Stay secure with live route mapping and integrated
									payments.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="relative z-10 text-white/60 text-xs">
					© {new Date().getFullYear()} MakeLyft. Powered by Odoo S.A.
				</div>
			</div>

			{/* Right Panel: Auth Forms */}
			<div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-gray-50">
				{currentView === "login" && (
					<Login
						onSwitchToSignup={() => setCurrentView("signup")}
						onLoginSuccess={handleLogin}
					/>
				)}

				{currentView === "signup" && (
					<Signup
						onSwitchToLogin={() => setCurrentView("login")}
						onSignupSuccess={handleSignup}
					/>
				)}

				{currentView === "success" && (
					<div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center space-y-6">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600">
							<CheckCircle2 className="w-10 h-10" />
						</div>
						<div className="space-y-2">
							<h2 className="text-2xl font-bold text-gray-900">
								Registration Successful
							</h2>
							<p className="text-sm text-gray-500">
								Welcome to MakeLyft,{" "}
								<span className="font-semibold text-gray-700">
									{userProfile?.name || userProfile?.email}
								</span>
								!
							</p>
						</div>
						<div className="bg-[#714B67]/5 rounded-xl p-4 border border-[#714B67]/10 text-left space-y-2 text-sm text-gray-700">
							<p>
								<strong>Organization:</strong>{" "}
								{userProfile?.organization}
							</p>
							<p>
								<strong>Email:</strong> {userProfile?.email}
							</p>
							{userProfile?.phone && (
								<p>
									<strong>Phone:</strong> {userProfile?.phone}
								</p>
							)}
						</div>
						<button
							onClick={() => {
								setCurrentView("login");
								setUserProfile(null);
							}}
							className="w-full py-3 bg-[#714B67] hover:bg-[#5c3c54] text-white font-semibold rounded-xl transition-colors"
						>
							Back to Login
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

export default AuthPortal;
