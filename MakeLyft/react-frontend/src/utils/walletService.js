import { showAlert } from "./alertService";

// MakeLyft Corporate Wallet Service
// Connects with backend /wallet endpoints with persistent client caching and real-time event broadcasting

const WALLET_EVENT = "makelyft_wallet_updated";

// Helper to load Razorpay SDK
const loadRazorpaySDK = () => {
	return new Promise((resolve) => {
		if (window.Razorpay) {
			resolve(true);
			return;
		}
		const script = document.createElement("script");
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.onload = () => resolve(true);
		script.onerror = () => resolve(false);
		document.body.appendChild(script);
	});
};

const DEFAULT_INITIAL_WALLET = {
	balance: 10000.0,
	currency: "₹",
	bank_connection: "HDFC Bank (•••• 4821)",
	upi_id: "user@okhdfcbank",
	transactions: [
		{
			id: "TXN-948201",
			type: "credit",
			title: "Monthly Commute Allowance",
			amount: 500.0,
			date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
			status: "Success",
			category: "Allowance",
			method: "Corporate Direct Credit",
		},
		{
			id: "TXN-839174",
			type: "debit",
			title: "Carpool to Salt Lake Sector V",
			amount: 45.0,
			date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
			status: "Success",
			category: "Ride Fare",
			method: "MakeLyft Wallet",
		},
		{
			id: "TXN-729013",
			type: "credit",
			title: "UPI Top-Up (Google Pay)",
			amount: 200.0,
			date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
			status: "Success",
			category: "Top-Up",
			method: "UPI",
		},
		{
			id: "TXN-618492",
			type: "debit",
			title: "Carpool to Park Street Corporate Park",
			amount: 55.0,
			date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
			status: "Success",
			category: "Ride Fare",
			method: "MakeLyft Wallet",
		},
	],
};

function getStorageKey(empId) {
	return `makelyft_wallet_${empId || "default"}`;
}

export const getWalletData = async (empId) => {
	const token = localStorage.getItem("token");
	const key = getStorageKey(empId);

	// Try fetching from backend first
	try {
		const response = await fetch("/wallet", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		});

		if (response.ok) {
			const data = await response.json();
			if (data && data.success && data.wallet) {
				// Preserve existing transaction history from local storage if available
				const existingLocal = localStorage.getItem(key);
				let existingTxns = DEFAULT_INITIAL_WALLET.transactions;
				if (existingLocal) {
					try {
						const parsedLocal = JSON.parse(existingLocal);
						if (parsedLocal && Array.isArray(parsedLocal.transactions)) {
							existingTxns = parsedLocal.transactions;
						}
					} catch (e) {
						console.warn("Error parsing local txns", e);
					}
				}

				const mergedWallet = {
					...DEFAULT_INITIAL_WALLET,
					...data.wallet,
					transactions: existingTxns
				};

				localStorage.setItem(key, JSON.stringify(mergedWallet));
				return mergedWallet;
			}
		}
	} catch (err) {
		console.warn("Backend wallet fetch fallback:", err.message);
	}

	// Fallback to local storage or	// Default fallback with 10,000 balance for Kash
	const cached = localStorage.getItem(key);
	if (cached) {
		try {
			const parsed = JSON.parse(cached);
			if (parsed && typeof parsed.balance === "number") {
				// Return parsed wallet directly without artificial resets
				return parsed;
			}
		} catch (e) {
			console.warn("Failed to parse cached wallet", e);
		}
	}

	localStorage.setItem(key, JSON.stringify(DEFAULT_INITIAL_WALLET));
	return DEFAULT_INITIAL_WALLET;
};

export const addMoneyToWallet = async (empId, amount, paymentMethod = "UPI") => {
	const token = localStorage.getItem("token");
	const key = getStorageKey(empId);
	const numAmount = parseFloat(amount);

	if (isNaN(numAmount) || numAmount <= 0) {
		throw new Error("Please enter a valid amount greater than zero.");
	}

	// Razorpay Integration
	const resLoad = await loadRazorpaySDK();
	if (!resLoad) {
		throw new Error("Razorpay SDK failed to load. Are you online?");
	}

	try {
		// 1. Create Order
		const orderRes = await fetch("/wallet/create-order", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ amount: numAmount }),
		});
		
		const orderData = await orderRes.json();
		if (!orderData.success) throw new Error("Failed to create order");

		// Fetch Razorpay public key
		const keyRes = await fetch("/wallet/razorpay-key", {
			headers: token ? { Authorization: `Bearer ${token}` } : {}
		});
		const keyData = await keyRes.json();
		if (!keyData.success || !keyData.key) throw new Error("Failed to get payment gateway key");

		// 2. Open Razorpay Checkout
		const options = {
			key: keyData.key,
			amount: orderData.order.amount,
			currency: orderData.order.currency,
			name: "MakeLyft Wallet",
			description: "Wallet Top-Up",
			order_id: orderData.order.id,
			handler: async function (response) {
				// 3. Verify Payment
				const verifyRes = await fetch("/wallet/verify-payment", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(token ? { Authorization: `Bearer ${token}` } : {}),
					},
					body: JSON.stringify({
						razorpay_payment_id: response.razorpay_payment_id,
						razorpay_order_id: response.razorpay_order_id,
						razorpay_signature: response.razorpay_signature,
					}),
				});
				
				const verifyData = await verifyRes.json();
				if (verifyData.success) {
					// 4. Update Backend Wallet Balance
					const addRes = await fetch("/wallet/add", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							...(token ? { Authorization: `Bearer ${token}` } : {}),
						},
						body: JSON.stringify({
							emp_id: empId,
							amount: numAmount,
							payment_method: paymentMethod,
						}),
					});
					const addData = await addRes.json();
					
					// 5. Update Local Wallet & History
					const currentWallet = await getWalletData(empId);
					// getWalletData already fetched the updated balance from the backend
					const newBalance = addData.balance !== undefined ? addData.balance : currentWallet.balance;
					
					const newTransaction = {
						id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
						type: "credit",
						title: `Razorpay Top-Up (${paymentMethod})`,
						amount: numAmount,
						date: new Date().toISOString(),
						status: "Success",
						category: "Top-Up",
						method: paymentMethod || "Razorpay / UPI",
					};

					const updatedWallet = {
						...currentWallet,
						balance: newBalance,
						transactions: [newTransaction, ...(currentWallet.transactions || [])],
					};

					const key = getStorageKey(empId);
					localStorage.setItem(key, JSON.stringify(updatedWallet));

					window.dispatchEvent(
						new CustomEvent(WALLET_EVENT, {
							detail: {
								empId,
								wallet: updatedWallet,
								balance: newBalance,
								transaction: newTransaction,
							},
						})
					);

					showAlert(`Payment successful! Added ₹${numAmount} to your wallet.`, "Payment Complete", "success");
				} else {
					showAlert("Payment verification failed.", "Payment Error", "error");
				}
			},
			prefill: {
				name: "MakeLyft User",
				email: "user@makelyft.corp",
				contact: "9999999999"
			},
			theme: {
				color: "#714B67"
			}
		};
		
		const rzp = new window.Razorpay(options);
		rzp.on('payment.failed', function (response){
			console.error("Payment Failed: ", response.error.description);
			// Removing the unprofessional alert()
		});
		rzp.open();
		
		// Return the current wallet so the UI doesn't blank out while waiting for Razorpay
		const currentWallet = await getWalletData(empId);
		return currentWallet;
	} catch (err) {
		console.warn("Razorpay flow failed, fallback to local state:", err.message);
	}

	// Fallback if Razorpay fails to load or user bypasses it (demo mode)
	const fallbackAddRes = await fetch("/wallet/add", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			emp_id: empId,
			amount: numAmount,
			payment_method: paymentMethod,
		}),
	});
	const fallbackAddData = await fallbackAddRes.json();

	// Read current wallet data
	const currentWallet = await getWalletData(empId);
	const newBalance = fallbackAddData.balance !== undefined ? fallbackAddData.balance : currentWallet.balance;

	const newTransaction = {
		id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
		type: "credit",
		title: `Wallet Top-Up (${paymentMethod})`,
		amount: numAmount,
		date: new Date().toISOString(),
		status: "Success",
		category: "Top-Up",
		method: paymentMethod,
	};

	const updatedWallet = {
		...currentWallet,
		balance: newBalance,
		transactions: [newTransaction, ...(currentWallet.transactions || [])],
	};

	localStorage.setItem(key, JSON.stringify(updatedWallet));

	// Notify all open UI instances
	window.dispatchEvent(
		new CustomEvent(WALLET_EVENT, {
			detail: {
				empId,
				wallet: updatedWallet,
				balance: newBalance,
				transaction: newTransaction,
			},
		})
	);

	showAlert(`Offline Top-up successful! Added ₹${numAmount}.`, "Payment Complete", "success");
	return updatedWallet;
};

export const deductMoneyForRide = async (empId, fare, rideDetails = {}) => {
	const key = getStorageKey(empId);
	const numFare = parseFloat(fare);
	const currentWallet = await getWalletData(empId);

	if (currentWallet.balance < numFare) {
		throw new Error("Insufficient wallet balance. Please add money to continue.");
	}

	const newBalance = parseFloat((currentWallet.balance - numFare).toFixed(2));
	const destinationName =
		rideDetails.destination?.name ||
		rideDetails.destName ||
		"Carpool Destination";

	const newTransaction = {
		id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
		type: "debit",
		title: `Carpool: ${destinationName}`,
		amount: numFare,
		date: new Date().toISOString(),
		status: "Success",
		category: "Ride Fare",
		method: "MakeLyft Wallet",
	};

	const updatedWallet = {
		...currentWallet,
		balance: newBalance,
		transactions: [newTransaction, ...(currentWallet.transactions || [])],
	};

	localStorage.setItem(key, JSON.stringify(updatedWallet));

	// Notify all open UI instances
	window.dispatchEvent(
		new CustomEvent(WALLET_EVENT, {
			detail: {
				empId,
				wallet: updatedWallet,
				balance: newBalance,
				transaction: newTransaction,
			},
		})
	);

	return updatedWallet;
};

export const subscribeToWallet = (callback) => {
	const handler = (e) => {
		if (e.detail && e.detail.wallet) {
			callback(e.detail.wallet);
		}
	};
	window.addEventListener(WALLET_EVENT, handler);
	return () => window.removeEventListener(WALLET_EVENT, handler);
};
