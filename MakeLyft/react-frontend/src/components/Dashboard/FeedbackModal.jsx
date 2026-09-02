import React, { useState } from "react";
import { X, MessageSquareHeart, Star, Send, ThumbsUp } from "lucide-react";

export default function FeedbackModal({ isOpen, onClose }) {
	const [rating, setRating] = useState(0);
	const [hover, setHover] = useState(0);
	const [feedback, setFeedback] = useState("");
	const [submitted, setSubmitted] = useState(false);

	if (!isOpen) return null;

	const handleSubmit = () => {
		// Mock submission
		setTimeout(() => {
			setSubmitted(true);
			setTimeout(() => {
				onClose();
				setSubmitted(false);
				setRating(0);
				setFeedback("");
			}, 2000);
		}, 500);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
			<div className="bg-[var(--bg-card)] w-full max-w-md rounded-xl shadow-none flex flex-col transform transition-all overflow-hidden border border-[var(--border)]">
				
				{/* Header - Odoo Theme */}
				<div className="p-6 bg-gradient-to-br from-[#00A09D] to-[#017E84] relative overflow-hidden">
					{/* Abstract Background Design */}
					<div className="absolute right-0 top-0 w-48 h-48 bg-[var(--bg-card)]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
					<div className="absolute left-0 bottom-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
					
					<div className="flex justify-between items-start relative z-10">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-xl bg-[var(--bg-card)] text-[var(--accent)] flex items-center justify-center shadow-none transform rotate-3">
								<MessageSquareHeart className="w-6 h-6" />
							</div>
							<div>
								<h2 className="text-xl font-bold text-white leading-tight drop-shadow-none">Share Feedback</h2>
								<p className="text-white/80 text-xs font-semibold uppercase tracking-wider mt-1">Help us improve MakeLyft</p>
							</div>
						</div>
						<button 
							onClick={onClose}
							className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-card)]/10 hover:bg-[var(--bg-card)]/20 text-white transition-colors cursor-pointer border border-white/10 hover:scale-105"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>

				<div className="p-8">
					{submitted ? (
						<div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in zoom-in duration-300">
							<div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
								<ThumbsUp className="w-8 h-8" />
							</div>
							<div className="text-center">
								<h3 className="text-lg font-bold text-[var(--text)]">Thank You!</h3>
								<p className="text-sm text-[var(--text-3)] mt-1">Your feedback has been submitted securely.</p>
							</div>
						</div>
					) : (
						<div className="space-y-6">
							<div className="text-center space-y-3">
								<p className="text-sm font-bold text-[var(--text-2)] uppercase tracking-wider">How was your overall experience?</p>
								<div className="flex justify-center gap-2">
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={star}
											onMouseEnter={() => setHover(star)}
											onMouseLeave={() => setHover(0)}
											onClick={() => setRating(star)}
											className="transform transition-all hover:scale-110 cursor-pointer"
										>
											<Star 
												className={`w-10 h-10 ${(hover || rating) >= star ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"}`} 
											/>
										</button>
									))}
								</div>
							</div>

							<div>
								<label className="block text-[11px] font-bold text-[var(--text-3)] uppercase tracking-widest mb-2 ml-1">Additional Comments</label>
								<textarea 
									value={feedback}
									onChange={(e) => setFeedback(e.target.value)}
									placeholder="Tell us what you loved or what could be better..."
									className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-transparent/20 focus:border-[var(--border-focus)] transition-all min-h-[120px] resize-none"
								></textarea>
							</div>

							<button 
								onClick={handleSubmit}
								disabled={rating === 0}
								className="w-full bg-[var(--primary)] hover:bg-[var(--primary)] disabled:opacity-50 text-white rounded-xl py-3.5 font-bold text-sm shadow-none shadow-[#714B67]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
							>
								Submit Feedback <Send className="w-4 h-4" />
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
