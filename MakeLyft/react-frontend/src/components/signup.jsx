import React, { useState } from "react";
import { User, Mail, Lock, Phone, Shield, ArrowRight, Car } from "lucide-react";

function checkPasswordStrength(password) {
	let score = 0;
	let feedback = [];

	if (!password) return { score: 0, strength: "Weak", feedback: [] };

	if (password.length > 8) score += 1;
	else feedback.push("Longer than 8 chars");

	if (password.length >= 12) score += 1;

	if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
	else feedback.push("Upper & lowercase");

	if (/\d/.test(password)) score += 1;
	else feedback.push("At least one number");

	if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
	else feedback.push("Special character");

	let strength = "Weak";
	if (score >= 4) strength = "Strong";
	else if (score === 3) strength = "Medium";

	return { score, strength, feedback };
}

function Signup({ onSwitchToLogin, onSignupSuccess }) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [organization, setOrganization] = useState("Odoo");
	const [role, setRole] = useState("employee"); // 'employee' or 'admin'
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [agreeTerms, setAgreeTerms] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	
	// OTP State
	const [showOtp, setShowOtp] = useState(false);
	const [otp, setOtp] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		setError("");

		if (!name || !email || !phone || !password || !confirmPassword) {
			setError("Please fill in all fields");
			return;
		}

		if (!email.includes("@")) {
			setError("Please enter a valid corporate email");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (!agreeTerms) {
			setError("You must agree to the Terms of Service & Privacy Policy");
			return;
		}

		setIsLoading(true);
		fetch("/auth/signup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, email, phone, organization, role, password })
		})
		.then(res => {
			if (!res.ok) {
				return res.json().then(data => { throw new Error(data.message || data.error || "Failed to sign up") });
			}
			return res.json();
		})
		.then(data => {
			setIsLoading(false);
			if (data.requires2FA) {
				setShowOtp(true);
			} else if (data.token) {
				localStorage.setItem("token", data.token);
				localStorage.setItem("user", JSON.stringify(data.user));
				onSignupSuccess?.({ ...data.user, organization });
			}
		})
		.catch(err => {
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
		fetch("/auth/verify-signup-otp", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, otp })
		})
		.then(res => {
			if (!res.ok) {
				return res.json().then(data => { throw new Error(data.message || "Invalid OTP") });
			}
			return res.json();
		})
		.then(data => {
			setIsLoading(false);
			if (data.token) {
				localStorage.setItem("token", data.token);
				localStorage.setItem("user", JSON.stringify(data.user));
				onSignupSuccess?.({ ...data.user, organization });
			}
		})
		.catch(err => {
			setIsLoading(false);
			setError(err.message || "Invalid OTP. Please try again.");
		});
	};

	return (
		<div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
			<div className="h-2 bg-[#714B67]"></div>

			<div className="p-8">
				<div className="text-center mb-6">
					<div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#714B67]/10 text-[#714B67] mb-4">
						<Car className="w-8 h-8" />
					</div>
					<h2 className="text-2xl font-bold text-gray-900 tracking-tight">
						Join MakeLyft
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						Start sharing rides with your colleagues
					</p>
				</div>

				{!showOtp ? (
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 animate-shake">
								<span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
								{error}
							</div>
						)}

						<div className="space-y-1">
							<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Full Name</label>
							<div className="relative">
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="John Doe"
									className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
								/>
								<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
									<User className="w-5 h-5" />
								</div>
							</div>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Organization</label>
							<div className="relative">
								<select
									value={organization}
									onChange={(e) => setOrganization(e.target.value)}
									className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all appearance-none cursor-pointer font-medium"
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

						<div className="space-y-1">
							<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</label>
							<div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
								<button
									type="button"
									onClick={() => setRole("employee")}
									className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
										role === "employee"
											? "bg-white text-[#714B67] shadow-sm border border-gray-200/60"
											: "text-gray-500 hover:text-gray-800"
									}`}
								>
									👤 Employee
								</button>
								<button
									type="button"
									onClick={() => setRole("admin")}
									className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
										role === "admin"
											? "bg-[#714B67] text-white shadow-sm"
											: "text-gray-500 hover:text-gray-800"
									}`}
								>
									⚡ Admin
								</button>
							</div>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Corporate Email</label>
							<div className="relative">
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="john.doe@odoo.com"
									className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
								/>
								<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
									<Mail className="w-5 h-5" />
								</div>
							</div>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone Number</label>
							<div className="relative">
								<input
									type="tel"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									placeholder="+1 (555) 000-0000"
									className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
								/>
								<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
									<Phone className="w-5 h-5" />
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Password</label>
								<div className="relative">
									<input
										type={showPassword ? "text" : "password"}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="••••••••"
										className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
									/>
									<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ">
										<Lock className="w-5 h-5" />
									</div>
								</div>
								{password && (() => {
									const strengthData = checkPasswordStrength(password);
									const s = strengthData.score;
									return (
										<div className="pt-1 w-full relative">
											<div className="flex gap-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-1">
												<div className={`h-full transition-all duration-300 ${s >= 1 ? 'w-1/4 bg-rose-400' : 'w-0'}`}></div>
												<div className={`h-full transition-all duration-300 ${s >= 2 ? (s >= 3 ? 'w-1/4 bg-amber-400' : 'w-1/4 bg-orange-400') : 'w-0'}`}></div>
												<div className={`h-full transition-all duration-300 ${s >= 3 ? (s >= 4 ? 'w-1/4 bg-emerald-400' : 'w-1/4 bg-amber-400') : 'w-0'}`}></div>
												<div className={`h-full transition-all duration-300 ${s >= 5 ? 'w-1/4 bg-emerald-500' : 'w-0'}`}></div>
											</div>
											<div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-wider text-gray-500 mt-1">
												<span className={s >= 4 ? 'text-emerald-500' : s === 3 ? 'text-amber-500' : 'text-rose-500'}>
													{strengthData.strength}
												</span>
												<span>{s}/5</span>
											</div>
											{strengthData.feedback.length > 0 && s < 4 && (
												<div className="text-[10px] text-gray-400 mt-0.5 leading-tight">
													Tip: {strengthData.feedback[0]}
												</div>
											)}
										</div>
									);
								})()}
							</div>
							<div className="space-y-1">
								<div className="flex justify-between items-center">
									<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Confirm</label>
									<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs font-semibold text-[#00A09D] hover:underline cursor-pointer">
										{showPassword ? "Hide" : "Show"}
									</button>
								</div>
								<div className="relative">
									<input
										type={showPassword ? "text" : "password"}
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="••••••••"
										className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
									/>
									<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
										<Lock className="w-5 h-5" />
									</div>
								</div>
							</div>
						</div>

						<div className="flex items-start gap-2 pt-1">
							<input
								type="checkbox"
								id="terms"
								checked={agreeTerms}
								onChange={(e) => setAgreeTerms(e.target.checked)}
								className="mt-1 w-4 h-4 text-[#714B67] focus:ring-[#714B67]/20 border-gray-300 rounded cursor-pointer"
							/>
							<label htmlFor="terms" className="text-xs text-gray-500 leading-normal cursor-pointer select-none">
								I agree to the <a href="#terms" className="font-semibold text-[#00A09D] hover:underline">Terms of Service</a> and <a href="#privacy" className="font-semibold text-[#00A09D] hover:underline">Privacy Policy</a>
							</label>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-3 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white font-semibold rounded-xl transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none shadow-md hover:shadow-lg shadow-[#714B67]/10"
						>
							{isLoading ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
							) : (
								<>Register Account <ArrowRight className="w-4 h-4" /></>
							)}
						</button>
					</form>
				) : (
					<form onSubmit={handleOtpSubmit} className="space-y-5 animate-fade-in">
						<div className="text-center mb-6">
							<h3 className="text-lg font-bold text-gray-900">Verify your email</h3>
							<p className="text-sm text-gray-500 mt-1">We sent a 6-digit code to {email}</p>
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
								<>Verify & Register <ArrowRight className="w-4 h-4" /></>
							)}
						</button>
						
						<button
							type="button"
							onClick={() => setShowOtp(false)}
							className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
						>
							Back to Edit Form
						</button>
					</form>
				)}

				{!showOtp && (
					<div className="mt-6 pt-5 border-t border-gray-100 text-center">
						<p className="text-sm text-gray-500">
							Already have an account?{" "}
							<button onClick={onSwitchToLogin} className="font-semibold text-[#00A09D] hover:underline ml-1 cursor-pointer">
								Log in here
							</button>
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

export default Signup;
