import React, { useState, useEffect } from "react";
import { showAlert } from "../utils/alertService";
import {
	Users,
	Car,
	Settings,
	LogOut,
	Search,
	Activity,
	Save,
	Bell,
	// User,
	// Shield,
	CheckCircle2,
	// Clock,
	LayoutDashboard,
	TrendingUp,
	// Fuel,
	ArrowRightLeft,
	Filter,
	Plus,
	X,
	// Sparkles,
	// AlertTriangle,
	// Building2,
	// MapPin,
	// UserCheck,
	// ShieldCheck,
	// ShieldAlert,
	ChevronRight,
	RefreshCw,
	Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import carModels from "../data/car_models.json";
import WalletModal from "./Dashboard/WalletModal";
import { getWalletData, subscribeToWallet } from "../utils/walletService";

function AdminDashboard() {
	const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'employees' | 'vehicles' | 'settings'
	const [metrics, setMetrics] = useState({
		total_employees: 48,
		total_vehicles: 22,
		rides_this_month: 163,
		active_rides: 4,
	});
	const [employees, setEmployees] = useState([]);
	const [vehicles, setVehicles] = useState([]);
	const [settings, setSettings] = useState({
		fuel_cost_per_km: "5.50",
		travel_cost_per_km: "2.00",
		max_rides_per_day: "5",
	});

	// UI & Search States
	const [searchTerm, setSearchTerm] = useState("");
	const [filterDepartment, setFilterDepartment] = useState("All");
	const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
	const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [notificationsOpen, setNotificationsOpen] = useState(false);
	const [walletModalOpen, setWalletModalOpen] = useState(false);
	const [walletBalance, setWalletBalance] = useState(650.0);
	const [successToast, setSuccessToast] = useState("");
	const [loading, setLoading] = useState(false);
	const [savingSettings, setSavingSettings] = useState(false);

	// New Employee State
	const [newEmp, setNewEmp] = useState({
		name: "",
		email: "",
		department: "Engineering",
		manager: "A. Shah",
		location: "Ahmedabad",
		role: "employee",
	});

	// New Vehicle State
	const [newVeh, setNewVeh] = useState({
		emp_id: "",
		vehicle_model: "Swift Dzire",
		veh_no: "",
		seating_capacity: 4,
		fuel_consumption_ratio: 16.0,
	});

	const navigate = useNavigate();
	const token = localStorage.getItem("token");
	const user = JSON.parse(localStorage.getItem("user") || "{}");

	useEffect(() => {
		if (!token) {
			navigate("/");
			return;
		}
		//eslint-disable-next-line
		fetchData();

		const empId = user.emp_id || "EMP-ADMIN";
		getWalletData(empId).then((data) => {
			if (data && typeof data.balance === "number") {
				setWalletBalance(data.balance);
			}
		});

		const unsubscribe = subscribeToWallet((updatedWallet) => {
			if (updatedWallet && typeof updatedWallet.balance === "number") {
				setWalletBalance(updatedWallet.balance);
			}
		});

		return () => unsubscribe();
		//eslint-disable-next-line
	}, [token, navigate]);

	const showToast = (msg) => {
		setSuccessToast(msg);
		setTimeout(() => setSuccessToast(""), 4000);
	};

	const fetchData = async () => {
		setLoading(true);
		await Promise.all([
			fetchMetrics(),
			fetchEmployees(),
			fetchVehicles(),
			fetchSettings(),
		]);
		setLoading(false);
	};

	const fetchMetrics = async () => {
		try {
			const res = await fetch("/admin/metrics", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.success && data.metrics) {
				setMetrics(data.metrics);
			}
		} catch (err) {
			console.error("Error fetching metrics", err);
		}
	};

	const fetchEmployees = async () => {
		try {
			const res = await fetch("/admin/employees", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.success && data.employees) {
				setEmployees(data.employees);
			}
		} catch (err) {
			console.error("Error fetching employees", err);
		}
	};

	const fetchVehicles = async () => {
		try {
			const res = await fetch("/admin/vehicles", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.success && data.vehicles) {
				setVehicles(data.vehicles);
			}
		} catch (err) {
			console.error("Error fetching vehicles", err);
		}
	};

	const fetchSettings = async () => {
		try {
			const res = await fetch("/admin/settings", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.success && data.settings) {
				setSettings(data.settings);
			}
		} catch (err) {
			console.error("Error fetching settings", err);
		}
	};

	// Add Employee
	const handleAddEmployee = async (e) => {
		e.preventDefault();
		try {
			const res = await fetch("/admin/employees", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(newEmp),
			});
			const data = await res.json();
			if (data.success) {
				showToast("Employee added successfully!");
				setShowAddEmployeeModal(false);
				setNewEmp({
					name: "",
					email: "",
					department: "Engineering",
					manager: "A. Shah",
					location: "Ahmedabad",
					role: "employee",
				});
				fetchEmployees();
				fetchMetrics();
			} else {
				showAlert(data.message || "Failed to add employee", "Admin Error", "error");
			}
		} catch (err) {
			console.error(err);
			showAlert("Error adding employee", "Admin Error", "error");
		}
	};

	// Toggle Employee Access
	const handleToggleAccess = async (emp_id) => {
		try {
			const res = await fetch("/admin/employees/toggle-access", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ emp_id }),
			});
			const data = await res.json();
			if (data.success) {
				showToast(data.message);
				fetchEmployees();
			}
		} catch (err) {
			console.error(err);
		}
	};

	// Add Vehicle
	const handleAddVehicle = async (e) => {
		e.preventDefault();
		try {
			const res = await fetch("/admin/vehicles", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(newVeh),
			});
			const data = await res.json();
			if (data.success) {
				showToast("Vehicle registered successfully!");
				setShowAddVehicleModal(false);
				setNewVeh({
					emp_id: "",
					vehicle_model: "Swift Dzire",
					veh_no: "",
					seating_capacity: 4,
					fuel_consumption_ratio: 16.0,
				});
				fetchVehicles();
				fetchEmployees();
				fetchMetrics();
			} else {
				showAlert(data.message || "Failed to add vehicle", "Admin Error", "error");
			}
		} catch (err) {
			console.error(err);
			showAlert("Error adding vehicle", "Admin Error", "error");
		}
	};

	// Toggle Vehicle Status
	const handleToggleVehicleStatus = async (veh_id) => {
		try {
			const res = await fetch("/admin/vehicles/toggle-status", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ veh_id }),
			});
			const data = await res.json();
			if (data.success) {
				showToast(data.message);
				fetchVehicles();
				fetchEmployees();
			}
		} catch (err) {
			console.error(err);
		}
	};

	// Approve Vehicle
	const handleApproveVehicle = async (veh_id) => {
		try {
			const res = await fetch("/admin/vehicles/approve", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ veh_id }),
			});
			const data = await res.json();
			if (data.success) {
				showToast(data.message);
				fetchVehicles();
				fetchEmployees();
			} else {
				showAlert(data.message || "Failed to approve vehicle", "Admin Error", "error");
			}
		} catch (err) {
			console.error(err);
		}
	};

	// Save Settings
	const handleUpdateSettings = async (e) => {
		e.preventDefault();
		setSavingSettings(true);
		try {
			const res = await fetch("/admin/settings", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(settings),
			});
			const data = await res.json();
			if (data.success) {
				showToast("Configurations saved successfully!");
				fetchSettings();
			}
		} catch (err) {
			console.error(err);
			showAlert("Error saving settings", "Admin Error", "error");
		} finally {
			setSavingSettings(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		navigate("/");
	};

	// Filtering
	const filteredEmployees = employees.filter((emp) => {
		const matchesSearch =
			emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			emp.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			emp.emp_id?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesDept =
			filterDepartment === "All" || emp.department === filterDepartment;
		return matchesSearch && matchesDept;
	});

	const filteredVehicles = vehicles.filter((v) => {
		return (
			v.veh_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			v.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			v.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			v.driver_email?.toLowerCase().includes(searchTerm.toLowerCase())
		);
	});

	return (
		<div className="flex h-screen bg-[#F4F6F9] font-sans antialiased text-gray-900 overflow-hidden text-left page-transition">
			{/* 1. ODOO DARK SIDEBAR */}
			<aside className="w-64 bg-[#714B67] text-white flex flex-col justify-between shadow-xl z-30 transition-all">
				<div>
					{/* Brand header */}
					<div className="p-5 border-b border-white/10 flex items-center gap-3">
						<div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-xs border border-white/20 shadow-inner">
							<Car className="w-6 h-6 text-[#E8D07A]" />
						</div>
						<div>
							<div className="font-extrabold text-lg tracking-tight flex items-center gap-1.5">
								MakeLyft
								<span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#00A09D] text-white rounded font-black">
									Admin
								</span>
							</div>
							<p className="text-[11px] text-white/70">
								Enterprise Fleet Mgmt
							</p>
						</div>
					</div>

					{/* Nav items */}
					<div className="p-3.5 space-y-1.5">
						<p className="px-3 py-1.5 text-[11px] font-bold text-white/50 uppercase tracking-wider">
							Control Center
						</p>

						<button
							onClick={() => setActiveTab("overview")}
							className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
								activeTab === "overview"
									? "bg-white text-[#714B67] shadow-sm font-black"
									: "text-white/80 hover:bg-white/10 hover:text-white"
							}`}
						>
							<LayoutDashboard className="w-4 h-4" />
							<span>Activity & Overview</span>
						</button>

						<button
							onClick={() => setActiveTab("employees")}
							className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
								activeTab === "employees"
									? "bg-white text-[#714B67] shadow-sm font-black"
									: "text-white/80 hover:bg-white/10 hover:text-white"
							}`}
						>
							<Users className="w-4 h-4" />
							<span>Employees ({employees.length})</span>
						</button>

						<button
							onClick={() => setActiveTab("vehicles")}
							className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
								activeTab === "vehicles"
									? "bg-white text-[#714B67] shadow-sm font-black"
									: "text-white/80 hover:bg-white/10 hover:text-white"
							}`}
						>
							<Car className="w-4 h-4" />
							<span>Vehicles ({vehicles.length})</span>
						</button>

						<button
							onClick={() => setActiveTab("settings")}
							className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
								activeTab === "settings"
									? "bg-white text-[#714B67] shadow-sm font-black"
									: "text-white/80 hover:bg-white/10 hover:text-white"
							}`}
						>
							<Settings className="w-4 h-4" />
							<span>Organization Settings</span>
						</button>
					</div>
				</div>

				{/* Sidebar Footer Profile */}
				<div className="p-4 border-t border-white/10 bg-black/10">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-full bg-[#E27D60] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-white/20">
								{user.name ? user.name.charAt(0).toUpperCase() : "A"}
							</div>
							<div className="text-left overflow-hidden">
								<p className="text-xs font-bold text-white truncate w-28">
									{user.name || "System Admin"}
								</p>
								<p className="text-[10px] text-white/60 truncate w-28">
									{user.email || "admin@makelyft.com"}
								</p>
							</div>
						</div>

						<button
							onClick={handleLogout}
							title="Logout"
							className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
						>
							<LogOut className="w-4 h-4" />
						</button>
					</div>
				</div>
			</aside>

			{/* 2. MAIN WORKSPACE */}
			<div className="flex-1 flex flex-col h-full overflow-hidden">
				{/* Top Navbar */}
				<header className="bg-white border-b border-gray-200/90 px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
					{/* Left: Breadcrumbs and Search */}
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2 text-xs font-bold">
							<span className="text-gray-400">MakeLyft</span>
							<ChevronRight className="w-3.5 h-3.5 text-gray-300" />
							<span className="text-[#00A09D] uppercase tracking-wider">
								{activeTab === "overview"
									? "Activity & Overview"
									: activeTab === "employees"
										? "Employees"
										: activeTab === "vehicles"
											? "Vehicles"
											: "Settings"}
							</span>
						</div>

						{/* Quick search input */}
						{(activeTab === "employees" || activeTab === "vehicles") && (
							<div className="relative w-64 ml-4 hidden sm:block">
								<Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
								<input
									type="text"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									placeholder={`Search ${activeTab}...`}
									className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
								/>
							</div>
						)}
					</div>

					{/* Right: Actions, Refresh, Notifications, Profile */}
					<div className="flex items-center gap-3">
						{/* Wallet Pill Button */}
						<button
							onClick={() => {
								setWalletModalOpen(true);
								setDropdownOpen(false);
								setNotificationsOpen(false);
							}}
							className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/70 text-[#714B67] border border-[#714B67]/20 transition-all cursor-pointer group"
							title="Open MakeLyft Commute Wallet"
						>
							<div className="w-5 h-5 rounded-lg bg-[#714B67] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
								<Wallet className="w-3 h-3" />
							</div>
							<div className="text-left flex flex-col leading-tight">
								<span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Wallet</span>
								<span className="text-xs font-extrabold text-gray-900 font-mono">
									₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</span>
							</div>
						</button>

						<button
							onClick={fetchData}
							title="Refresh Data"
							className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
						>
							<RefreshCw
								className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
							/>
						</button>

						{/* Notification Bell */}
						<div className="relative">
							<button
								onClick={() => {
									setNotificationsOpen(!notificationsOpen);
									setDropdownOpen(false);
								}}
								className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer relative"
							>
								<Bell className="w-4 h-4" />
								<span className="absolute top-1 right-1 w-2 h-2 bg-[#00A09D] rounded-full ring-2 ring-white"></span>
							</button>

							{notificationsOpen && (
								<div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
									<div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
										<p className="text-xs font-bold text-gray-900">
											System Alerts
										</p>
										<span className="text-[10px] text-[#00A09D] font-bold">
											2 New
										</span>
									</div>
									<div className="divide-y divide-gray-50 text-xs">
										<div className="p-3 hover:bg-gray-50 flex items-start gap-2.5">
											<CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
											<div>
												<p className="font-semibold text-gray-800">
													Database connected
												</p>
												<p className="text-[11px] text-gray-400">
													PostgreSQL active
												</p>
											</div>
										</div>
										<div className="p-3 hover:bg-gray-50 flex items-start gap-2.5">
											<Car className="w-4 h-4 text-[#714B67] shrink-0 mt-0.5" />
											<div>
												<p className="font-semibold text-gray-800">
													Vehicles synchronized
												</p>
												<p className="text-[11px] text-gray-400">
													Ready for rides
												</p>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Profile Dropdown */}
						<div className="relative">
							<button
								onClick={() => {
									setDropdownOpen(!dropdownOpen);
									setNotificationsOpen(false);
								}}
								className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 cursor-pointer"
							>
								<span className="text-xs font-bold text-gray-800">
									Admin
								</span>
								<div className="w-6 h-6 rounded-full bg-[#E27D60] text-white flex items-center justify-center font-bold text-xs shadow-xs">
									{user.name ? user.name.charAt(0).toUpperCase() : "A"}
								</div>
							</button>

							{dropdownOpen && (
								<div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
									<div className="px-4 py-2.5 border-b border-gray-100">
										<p className="text-xs font-bold text-gray-900 truncate">
											{user.name || "System Admin"}
										</p>
										<p className="text-[11px] text-gray-500 truncate">
											{user.email || ""}
										</p>
									</div>

									<button
										onClick={() => {
											setDropdownOpen(false);
											navigate("/dashboard");
										}}
										className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-[#714B67]/5 hover:text-[#714B67] flex items-center gap-2.5 cursor-pointer transition-colors"
									>
										<ArrowRightLeft className="w-4 h-4 text-[#714B67]" />
										Switch to Employee Dashboard
									</button>

									<div className="h-px bg-gray-100 my-1"></div>

									<button
										onClick={handleLogout}
										className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer transition-colors"
									>
										<LogOut className="w-4 h-4 text-red-500" />
										Logout
									</button>
								</div>
							)}
						</div>
					</div>
				</header>

				{/* Workspace Body */}
				<main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
					{/* Toast Notification */}
					{successToast && (
						<div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold animate-in fade-in duration-150 shadow-xs">
							<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
							<span>{successToast}</span>
						</div>
					)}

					{/* --- TAB 1: ACTIVITY & OVERVIEW --- */}
					{activeTab === "overview" && (
						<div className="space-y-6 animate-in fade-in duration-150">
							{/* Top KPI Metrics Banner */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-5">
								<div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
									<div className="flex items-center justify-between mb-3">
										<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
											Total Employees
										</span>
										<div className="w-8 h-8 rounded-lg bg-[#00A09D]/10 text-[#00A09D] flex items-center justify-center">
											<Users className="w-4 h-4" />
										</div>
									</div>
									<div className="text-3xl font-extrabold text-[#00A09D] tracking-tight">
										{metrics.total_employees}
									</div>
									<p className="text-[11px] text-gray-500 mt-1">
										Verified organization workforce
									</p>
								</div>

								<div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
									<div className="flex items-center justify-between mb-3">
										<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
											Registered Vehicles
										</span>
										<div className="w-8 h-8 rounded-lg bg-[#714B67]/10 text-[#714B67] flex items-center justify-center">
											<Car className="w-4 h-4" />
										</div>
									</div>
									<div className="text-3xl font-extrabold text-[#714B67] tracking-tight">
										{metrics.total_vehicles}
									</div>
									<p className="text-[11px] text-gray-500 mt-1">
										Active carpooling fleet
									</p>
								</div>

								<div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
									<div className="flex items-center justify-between mb-3">
										<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
											Rides This Month
										</span>
										<div className="w-8 h-8 rounded-lg bg-[#E27D60]/10 text-[#E27D60] flex items-center justify-center">
											<TrendingUp className="w-4 h-4" />
										</div>
									</div>
									<div className="text-3xl font-extrabold text-[#E27D60] tracking-tight">
										{metrics.rides_this_month}
									</div>
									<p className="text-[11px] text-gray-500 mt-1">
										Completed commute trips
									</p>
								</div>

								<div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
									<div className="flex items-center justify-between mb-3">
										<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
											Active Carpools
										</span>
										<div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
											<Activity className="w-4 h-4" />
										</div>
									</div>
									<div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
										{metrics.active_rides}
									</div>
									<p className="text-[11px] text-gray-500 mt-1">
										Live or scheduled on route
									</p>
								</div>
							</div>

							{/* Quick Actions & Overview Cards */}
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
								{/* Recent Registered Vehicles */}
								<div className="lg:col-span-2 bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
									<div className="flex items-center justify-between border-b border-gray-100 pb-4">
										<div>
											<h3 className="text-base font-bold text-gray-900">
												Fleet Highlights
											</h3>
											<p className="text-xs text-gray-500">
												Recently added employee vehicles
											</p>
										</div>
										<button
											onClick={() => setActiveTab("vehicles")}
											className="text-xs font-bold text-[#00A09D] hover:underline flex items-center gap-1 cursor-pointer"
										>
											View All{" "}
											<ChevronRight className="w-3.5 h-3.5" />
										</button>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										{vehicles.slice(0, 4).map((v) => (
											<div
												key={v.veh_id}
												className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/80 flex items-center justify-between"
											>
												<div className="flex items-center gap-3">
													<div className="w-9 h-9 rounded-lg bg-[#714B67]/10 text-[#714B67] flex items-center justify-center">
														<Car className="w-5 h-5" />
													</div>
													<div>
														<p className="text-xs font-bold text-gray-900 uppercase">
															{v.veh_no}
														</p>
														<p className="text-[11px] text-gray-600">
															{v.vehicle_model} •{" "}
															{v.seating_capacity} seats
														</p>
														<p className="text-[10px] text-gray-400">
															Owner:{" "}
															{v.driver_name || "Assigned"}
														</p>
													</div>
												</div>
												<span
													className={`px-2 py-0.5 rounded text-[10px] font-bold ${
														(
															v.status || "Active"
														).toLowerCase() === "active"
															? "bg-emerald-50 text-emerald-700 border border-emerald-200"
															: "bg-red-50 text-red-700 border border-red-200"
													}`}
												>
													{v.status || "Active"}
												</span>
											</div>
										))}
									</div>
								</div>

								{/* Quick Admin Actions Box */}
								<div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
									<h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-4">
										Quick Operations
									</h3>
									<div className="space-y-2.5">
										<button
											onClick={() => {
												setActiveTab("employees");
												setShowAddEmployeeModal(true);
											}}
											className="w-full p-3 bg-[#00A09D]/10 hover:bg-[#00A09D]/20 text-[#00A09D] rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer"
										>
											<Plus className="w-4 h-4" />
											Add New Employee
										</button>

										<button
											onClick={() => {
												setActiveTab("vehicles");
												setShowAddVehicleModal(true);
											}}
											className="w-full p-3 bg-[#714B67]/10 hover:bg-[#714B67]/20 text-[#714B67] rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer"
										>
											<Plus className="w-4 h-4" />
											Register New Vehicle
										</button>

										<button
											onClick={() => setActiveTab("settings")}
											className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer"
										>
											<Settings className="w-4 h-4 text-gray-600" />
											Adjust Commute Subsidy
										</button>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* --- TAB 2: EMPLOYEES (Matching Image 1 Wireframe) --- */}
					{activeTab === "employees" && (
						<div className="space-y-5 animate-in fade-in duration-150">
							{/* Header + Action */}
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div>
									<h2 className="text-xl font-extrabold text-gray-900">
										Employee Directory & Access
									</h2>
									<p className="text-xs text-gray-500">
										Manage company members, platform access
										permissions, and driver statuses.
									</p>
								</div>

								<div className="flex items-center gap-3">
									{/* Department Filter */}
									<div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs">
										<Filter className="w-3.5 h-3.5 text-gray-400" />
										<select
											value={filterDepartment}
											onChange={(e) =>
												setFilterDepartment(e.target.value)
											}
											className="bg-transparent focus:outline-none cursor-pointer"
										>
											<option value="All">All Departments</option>
											<option value="Engineering">
												Engineering
											</option>
											<option value="Sales">Sales</option>
											<option value="HR">HR</option>
											<option value="Finance">Finance</option>
											<option value="Operations">Operations</option>
										</select>
									</div>

									{/* + Add Employee Button */}
									<button
										onClick={() => setShowAddEmployeeModal(true)}
										className="px-4 py-2 bg-[#00A09D] hover:bg-[#008f8c] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
									>
										<Plus className="w-4 h-4" /> Add Employee
									</button>
								</div>
							</div>

							{/* Employees Table */}
							<div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs">
								<div className="overflow-x-auto">
									<table className="w-full text-left border-collapse">
										<thead>
											<tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-bold text-[#00A09D]">
												<th className="py-3.5 px-6">Name</th>
												<th className="py-3.5 px-6">Email</th>
												<th className="py-3.5 px-6">Department</th>
												<th className="py-3.5 px-6">Manager</th>
												<th className="py-3.5 px-6">Location</th>
												<th className="py-3.5 px-6 text-right">
													Platform Access
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-100 text-xs">
											{filteredEmployees.length > 0 ? (
												filteredEmployees.map((emp) => {
													const isGranted =
														(
															emp.platform_access || "Granted"
														).toLowerCase() === "granted";
													return (
														<tr
															key={emp.emp_id}
															className="hover:bg-gray-50/60 transition-colors"
														>
															<td className="py-4 px-6 font-bold text-gray-900">
																{emp.name}
															</td>
															<td className="py-4 px-6 font-mono text-gray-600">
																{emp.email}
															</td>
															<td className="py-4 px-6 text-gray-700">
																{emp.department ||
																	"Engineering"}
															</td>
															<td className="py-4 px-6 text-gray-700">
																{emp.manager || "A. Shah"}
															</td>
															<td className="py-4 px-6 text-gray-700">
																{emp.location || "Ahmedabad"}
															</td>
															<td className="py-4 px-6 text-right">
																<button
																	onClick={() =>
																		handleToggleAccess(
																			emp.emp_id,
																		)
																	}
																	title="Click to toggle access"
																	className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
																		isGranted
																			? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
																			: "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
																	}`}
																>
																	{isGranted
																		? "[Granted]"
																		: "[Revoked]"}
																</button>
															</td>
														</tr>
													);
												})
											) : (
												<tr>
													<td
														colSpan={6}
														className="py-8 text-center text-gray-400"
													>
														No employees found matching criteria.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					)}

					{/* --- TAB 3: VEHICLES (Matching Image 2 Wireframe) --- */}
					{activeTab === "vehicles" && (
						<div className="space-y-5 animate-in fade-in duration-150">
							{/* Header + Action */}
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div>
									<h2 className="text-xl font-extrabold text-gray-900">
										Carpooling Fleet & Vehicles
									</h2>
									<p className="text-xs text-gray-500">
										View registered employee vehicles, seating limits,
										and verification status.
									</p>
								</div>

								<div className="flex items-center gap-3">
									<button
										onClick={() => setShowAddVehicleModal(true)}
										className="px-4 py-2 bg-[#00A09D] hover:bg-[#008f8c] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
									>
										<Plus className="w-4 h-4" /> Add Vehicle
									</button>
								</div>
							</div>

							{/* Vehicles Table */}
							<div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs">
								<div className="overflow-x-auto">
									<table className="w-full text-left border-collapse">
										<thead>
											<tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-bold text-[#00A09D]">
												<th className="py-3.5 px-6">
													Registration Number
												</th>
												<th className="py-3.5 px-6">Model</th>
												<th className="py-3.5 px-6">
													Seating Capacity
												</th>
												<th className="py-3.5 px-6">Driver</th>
												<th className="py-3.5 px-6 text-right">
													Status
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-100 text-xs">
											{filteredVehicles.length > 0 ? (
												filteredVehicles.map((v) => {
													const isActive =
														(
															v.status || "Active"
														).toLowerCase() === "active";
													return (
														<tr
															key={v.veh_id}
															className="hover:bg-gray-50/60 transition-colors"
														>
															<td className="py-4 px-6 font-mono font-bold text-gray-900 uppercase">
																{v.veh_no}
															</td>
															<td className="py-4 px-6 font-semibold text-gray-800">
																{v.vehicle_model}
															</td>
															<td className="py-4 px-6 text-gray-700">
																{v.seating_capacity}
															</td>
															<td className="py-4 px-6 font-medium text-gray-900">
																{v.driver_name || "Unassigned"}
															</td>
															<td className="py-4 px-6 text-right">
																{v.is_vehicle_registered === "1" ? (
																	<button
																		onClick={() => handleApproveVehicle(v.veh_id)}
																		className="px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
																	>
																		[Approve]
																	</button>
																) : (
																	<button
																		onClick={() => handleToggleVehicleStatus(v.veh_id)}
																		title="Click to toggle status"
																		className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
																			isActive
																				? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
																				: "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
																		}`}
																	>
																		{isActive ? "[Active]" : "[Inactive]"}
																	</button>
																)}
															</td>
														</tr>
													);
												})
											) : (
												<tr>
													<td
														colSpan={5}
														className="py-8 text-center text-gray-400"
													>
														No vehicles registered yet.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					)}

					{/* --- TAB 4: SETTINGS --- */}
					{activeTab === "settings" && (
						<div className="max-w-2xl bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-6 animate-in fade-in duration-150">
							<div>
								<h3 className="text-lg font-bold text-gray-900">
									Organization Configurations
								</h3>
								<p className="text-xs text-gray-500 mt-0.5">
									Manage fuel reimbursement rules, corporate commute
									subsidy, and daily driver limits.
								</p>
							</div>

							<form
								onSubmit={handleUpdateSettings}
								className="space-y-4"
							>
								<div>
									<label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
										Fuel Cost per Km (₹)
									</label>
									<input
										type="number"
										step="0.01"
										value={settings.fuel_cost_per_km || ""}
										onChange={(e) =>
											setSettings({
												...settings,
												fuel_cost_per_km: e.target.value,
											})
										}
										placeholder="5.50"
										className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
									/>
								</div>

								<div>
									<label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
										Travel Cost per Km Subsidy (₹)
									</label>
									<input
										type="number"
										step="0.01"
										value={settings.travel_cost_per_km || ""}
										onChange={(e) =>
											setSettings({
												...settings,
												travel_cost_per_km: e.target.value,
											})
										}
										placeholder="2.00"
										className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
									/>
								</div>

								<div>
									<label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
										Max Rides Publishable per Day (Per Driver)
									</label>
									<input
										type="number"
										value={settings.max_rides_per_day || ""}
										onChange={(e) =>
											setSettings({
												...settings,
												max_rides_per_day: e.target.value,
											})
										}
										placeholder="5"
										className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
									/>
								</div>

								<div className="pt-4 border-t border-gray-100 flex justify-end">
									<button
										type="submit"
										disabled={savingSettings}
										className="px-6 py-2.5 bg-[#714B67] hover:bg-[#5c3c54] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
									>
										<Save className="w-4 h-4" />
										{savingSettings
											? "Saving..."
											: "Save Configurations"}
									</button>
								</div>
							</form>
						</div>
					)}
				</main>
			</div>

			{/* MODAL 1: ADD EMPLOYEE */}
			{showAddEmployeeModal && (
				<div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
						<div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
							<div className="flex items-center gap-2.5">
								<div className="w-8 h-8 bg-[#00A09D]/10 rounded-lg flex items-center justify-center text-[#00A09D]">
									<Users className="w-4 h-4" />
								</div>
								<h3 className="text-base font-bold text-gray-900">
									Add Employee
								</h3>
							</div>
							<button
								onClick={() => setShowAddEmployeeModal(false)}
								className="text-gray-400 hover:text-gray-600 cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<form
							onSubmit={handleAddEmployee}
							className="p-5 space-y-3.5"
						>
							<div>
								<label className="block text-xs font-bold uppercase text-gray-600 mb-1">
									Full Name
								</label>
								<input
									required
									type="text"
									value={newEmp.name}
									onChange={(e) =>
										setNewEmp({ ...newEmp, name: e.target.value })
									}
									placeholder="e.g. Raj Patel"
									className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D]"
								/>
							</div>

							<div>
								<label className="block text-xs font-bold uppercase text-gray-600 mb-1">
									Corporate Email
								</label>
								<input
									required
									type="email"
									value={newEmp.email}
									onChange={(e) =>
										setNewEmp({ ...newEmp, email: e.target.value })
									}
									placeholder="raj.patel@co.com"
									className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D]"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-xs font-bold uppercase text-gray-600 mb-1">
										Department
									</label>
									<select
										value={newEmp.department}
										onChange={(e) =>
											setNewEmp({
												...newEmp,
												department: e.target.value,
											})
										}
										className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D]"
									>
										<option value="Engineering">Engineering</option>
										<option value="Sales">Sales</option>
										<option value="HR">HR</option>
										<option value="Finance">Finance</option>
										<option value="Operations">Operations</option>
									</select>
								</div>

								<div>
									<label className="block text-xs font-bold uppercase text-gray-600 mb-1">
										Manager
									</label>
									<input
										type="text"
										value={newEmp.manager}
										onChange={(e) =>
											setNewEmp({
												...newEmp,
												manager: e.target.value,
											})
										}
										placeholder="e.g. A. Shah"
										className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D]"
									/>
								</div>
							</div>

							<div>
								<label className="block text-xs font-bold uppercase text-gray-600 mb-1">
									Location
								</label>
								<input
									type="text"
									value={newEmp.location}
									onChange={(e) =>
										setNewEmp({ ...newEmp, location: e.target.value })
									}
									placeholder="Ahmedabad"
									className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D]"
								/>
							</div>

							<div className="pt-3 flex gap-2">
								<button
									type="button"
									onClick={() => setShowAddEmployeeModal(false)}
									className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="flex-1 py-2 text-xs font-bold text-white bg-[#00A09D] hover:bg-[#008f8c] rounded-xl transition-colors cursor-pointer shadow-xs"
								>
									Add Employee
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* MODAL 2: ADD VEHICLE */}
			{showAddVehicleModal && (
				<div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
						<div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
							<div className="flex items-center gap-2.5">
								<div className="w-8 h-8 bg-[#714B67]/10 rounded-lg flex items-center justify-center text-[#714B67]">
									<Car className="w-4 h-4" />
								</div>
								<h3 className="text-base font-bold text-gray-900">
									Add Vehicle
								</h3>
							</div>
							<button
								onClick={() => setShowAddVehicleModal(false)}
								className="text-gray-400 hover:text-gray-600 cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<form onSubmit={handleAddVehicle} className="p-5 space-y-3.5">
							<div>
								<label className="block text-xs font-bold uppercase text-gray-600 mb-1">
									Assign to Employee
								</label>
								<select
									required
									value={newVeh.emp_id}
									onChange={(e) =>
										setNewVeh({ ...newVeh, emp_id: e.target.value })
									}
									className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
								>
									<option value="" disabled>
										Select an employee
									</option>
									{employees.map((emp) => (
										<option key={emp.emp_id} value={emp.emp_id}>
											{emp.name} ({emp.email})
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-xs font-bold uppercase text-gray-600 mb-1">
									Vehicle Model
								</label>
								<select
									required
									value={newVeh.vehicle_model}
									onChange={(e) =>
										setNewVeh({
											...newVeh,
											vehicle_model: e.target.value,
										})
									}
									className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
								>
									{carModels.map((m) => (
										<option key={m} value={m}>
											{m}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-xs font-bold uppercase text-gray-600 mb-1">
									Registration Number
								</label>
								<input
									required
									type="text"
									value={newVeh.veh_no}
									onChange={(e) =>
										setNewVeh({
											...newVeh,
											veh_no: e.target.value.toUpperCase(),
										})
									}
									placeholder="GJ01AB1234"
									className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs uppercase focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-xs font-bold uppercase text-gray-600 mb-1">
										Seating Capacity
									</label>
									<input
										required
										type="number"
										min="1"
										max="8"
										value={newVeh.seating_capacity}
										onChange={(e) =>
											setNewVeh({
												...newVeh,
												seating_capacity: e.target.value,
											})
										}
										className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
									/>
								</div>

								<div>
									<label className="block text-xs font-bold uppercase text-gray-600 mb-1">
										Mileage (km/L)
									</label>
									<input
										required
										type="number"
										step="0.1"
										value={newVeh.fuel_consumption_ratio}
										onChange={(e) =>
											setNewVeh({
												...newVeh,
												fuel_consumption_ratio: e.target.value,
											})
										}
										className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
									/>
								</div>
							</div>

							<div className="pt-3 flex gap-2">
								<button
									type="button"
									onClick={() => setShowAddVehicleModal(false)}
									className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="flex-1 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5c3c54] rounded-xl transition-colors cursor-pointer shadow-xs"
								>
									Add Vehicle
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Wallet Modal */}
			<WalletModal
				isOpen={walletModalOpen}
				onClose={() => setWalletModalOpen(false)}
			/>
		</div>
	);
}

export default AdminDashboard;

