import React, { useState } from "react";
import { X, Car } from "lucide-react";
import carModels from "../../data/car_models.json";

function VehicleRegistrationModal({ onClose, onRegister }) {
	const [vehicle_model, setVehicleModel] = useState("");
	const [vehicle_no, setVehicleNo] = useState("");
	const [max_seating_cap, setCapacity] = useState(4);
	const [DL_no, setDlNo] = useState("");
	const [insurance_no, setInsuranceNo] = useState("");
	const [fuel_consumption_ratio, setFuelConsumption] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		onRegister({
			vehicle_model,
			vehicle_no,
			max_seating_cap,
			DL_no,
			insurance_no,
			fuel_consumption_ratio,
		});
	};

	return (
		<div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
			<div className="bg-[var(--bg-card)] rounded-xl shadow-none w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
				<div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--bg-hover)]/50 shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)]">
							<Car className="w-5 h-5" />
						</div>
						<h2 className="text-xl font-bold text-[var(--text)]">
							Register Vehicle
						</h2>
					</div>
					<button
						onClick={onClose}
						className="text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<div className="overflow-y-auto p-6">
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider">
									Vehicle Make & Model
								</label>
								<select
									required
									value={vehicle_model}
									onChange={(e) => setVehicleModel(e.target.value)}
									className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[var(--border-focus)] transition-all"
								>
									<option value="" disabled>Select a vehicle model</option>
									{carModels.map(model => (
										<option key={model} value={model}>{model}</option>
									))}
								</select>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider">
									Vehicle No (License Plate)
								</label>
								<input
									required
									type="text"
									value={vehicle_no}
									onChange={(e) => setVehicleNo(e.target.value)}
									placeholder="ABC-1234"
									className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[var(--border-focus)] transition-all uppercase"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider">
									Max Seating Capacity
								</label>
								<input
									required
									type="number"
									min="1"
									max="8"
									value={max_seating_cap}
									onChange={(e) => setCapacity(e.target.value)}
									className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[var(--border-focus)] transition-all"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider">
									Driver's License No
								</label>
								<input
									required
									type="text"
									value={DL_no}
									onChange={(e) => setDlNo(e.target.value)}
									placeholder="DL-XXXXX"
									className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[var(--border-focus)] transition-all uppercase"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider">
									Insurance No
								</label>
								<input
									required
									type="text"
									value={insurance_no}
									onChange={(e) => setInsuranceNo(e.target.value)}
									placeholder="INS-XXXXX"
									className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[var(--border-focus)] transition-all uppercase"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider">
									Fuel Consumption Ratio (km/l)
								</label>
								<input
									required
									type="number"
									min="1"
									step="0.1"
									value={fuel_consumption_ratio}
									onChange={(e) => setFuelConsumption(e.target.value)}
									placeholder="e.g. 15.5"
									className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[var(--border-focus)] transition-all"
								/>
							</div>
						</div>

						<div className="pt-4">
							<button
								type="submit"
								className="w-full py-3 px-4 bg-[var(--primary)] hover:bg-[var(--primary)] text-white font-semibold rounded-xl transition-all shadow-none"
							>
								Complete Registration
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

export default VehicleRegistrationModal;
