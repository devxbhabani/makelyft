import React, { useState } from "react";
import { Mail, Lock, ArrowRight, Car, Eye, EyeOff, Shield } from "lucide-react";
// import { useNavigate } from "react-router-dom";

function Login({ onSwitchToSignup, onLoginSuccess }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [organization, setOrganization] = useState("Odoo");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	// OTP State
	const [showOtp, setShowOtp] = useState(false);
	const [otp, setOtp] = useState("");
	const [resolvedEmail, setResolvedEmail] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		setError("");

		if (!email || !password) {
			setError("Please fill in all fields");
			return;
		}

		if (!email.endsWith(".com") && !email.includes("@")) {
			setError("Please enter a valid corporate email");
			return;
		}

		setIsLoading(true);
		fetch("/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password, organization }),
		})
			.then((res) => {
				if (!res.ok) {
					return res.json().then((data) => {
						throw new Error(
							data.message || data.error || "Failed to log in",
						);
					});
				}
				return res.json();
			})
			.then((data) => {
				setIsLoading(false);
				if (data.requires2FA) {
					setShowOtp(true);
					setResolvedEmail(data.resolvedEmail || email);
				} else if (data.token) {
					localStorage.setItem("token", data.token);
					localStorage.setItem("user", JSON.stringify(data.user));
					onLoginSuccess?.({ ...data.user, organization });
				}
			})
			.catch((err) => {
				setIsLoading(false);
				setError(err.message || "Something went wrong. Please try again.");
			});
	};

	const handleOtpSubmit = (e) => {
		e.preventDefault();
		setError("");
		if (!otp) {
			setError("Please enter the OTP");
			return;
		}

		setIsLoading(true);
		fetch("/auth/verify-otp", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: resolvedEmail, otp }),
		})
			.then((res) => {
				if (!res.ok) {
					return res.json().then((data) => {
						throw new Error(data.message || "Invalid OTP");
					});
				}
				return res.json();
			})
			.then((data) => {
				setIsLoading(false);
				if (data.token) {
					localStorage.setItem("token", data.token);
					localStorage.setItem("user", JSON.stringify(data.user));
					onLoginSuccess?.({ ...data.user, organization });
				}
			})
			.catch((err) => {
				setIsLoading(false);
				setError(err.message || "Invalid OTP. Please try again.");
			});
	};

	return (
		<div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
			<div className="h-2 bg-[#714B67]"></div>

			<div className="p-8">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#714B67]/10 text-[#714B67] mb-4">
						<Car className="w-8 h-8" />
					</div>
					<h2 className="text-2xl font-bold text-gray-900 tracking-tight">
						Welcome to MakeLyft
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						Enterprise Carpooling Platform
					</p>
				</div>

				{!showOtp ? (
					<form onSubmit={handleSubmit} className="space-y-5">
						{error && (
							<div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 animate-shake">
								<span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
								{error}
							</div>
						)}

						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
								Select Organization
							</label>
							<div className="relative">
								<select
									value={organization}
									onChange={(e) => setOrganization(e.target.value)}
									className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all appearance-none cursor-pointer font-medium"
								>
									<option value="Odoo">Odoo S.A.</option>
									<option value="Google">Google Inc.</option>
									<option value="Microsoft">Microsoft Corp.</option>
									<option value="Meta">Meta Platforms</option>
								</select>
								<div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
									<Shield className="w-4 h-4" />
								</div>
							</div>
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
								Corporate Email
							</label>
							<div className="relative">
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="name@company.com"
									className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all placeholder:text-gray-400"
								/>
								<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
									<Mail className="w-5 h-5" />
								</div>
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Password
								</label>
								{/* <a href="#forgot" className="text-xs font-semibold text-[#00A09D] hover:underline">
									Forgot password?
								</a> */}
							</div>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all placeholder:text-gray-400"
								/>
								<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
									<Lock className="w-5 h-5" />
								</div>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
								>
									{showPassword ? (
										<EyeOff className="w-5 h-5" />
									) : (
										<Eye className="w-5 h-5" />
									)}
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-3.5 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white font-semibold rounded-xl transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none shadow-md hover:shadow-lg shadow-[#714B67]/10"
						>
							{isLoading ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
							) : (
								<>
									Sign In <ArrowRight className="w-4 h-4" />
								</>
							)}
						</button>
					</form>
				) : (
					<form
						onSubmit={handleOtpSubmit}
						className="space-y-5 animate-fade-in"
					>
						<div className="text-center mb-6">
							<h3 className="text-lg font-bold text-gray-900">
								Check your email
							</h3>
							<p className="text-sm text-gray-500 mt-1">
								We sent a 6-digit code to {resolvedEmail}
							</p>
						</div>

						{error && (
							<div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 animate-shake">
								<span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
								{error}
							</div>
						)}

						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
								Verification Code
							</label>
							<input
								type="text"
								value={otp}
								onChange={(e) => setOtp(e.target.value)}
								placeholder="000000"
								className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center tracking-[0.5em] text-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
								maxLength={6}
							/>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-3.5 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white font-semibold rounded-xl transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none shadow-md hover:shadow-lg shadow-[#714B67]/10"
						>
							{isLoading ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
							) : (
								<>
									Verify & Continue <ArrowRight className="w-4 h-4" />
								</>
							)}
						</button>

						<button
							type="button"
							onClick={() => setShowOtp(false)}
							className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
						>
							Back to Login
						</button>
					</form>
				)}

				{!showOtp && (
					<div className="mt-8 pt-6 border-t border-gray-100 text-center">
						<p className="text-sm text-gray-500">
							New to the platform?{" "}
							<button
								onClick={onSwitchToSignup}
								className="font-semibold text-[#00A09D] hover:underline ml-1 cursor-pointer"
							>
								Create an account
							</button>
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

export default Login;
