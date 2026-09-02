class VoiceCall {
	constructor(socket, isCaller) {
		this.socket = socket;
		this.isCaller = isCaller;
		this.pc = new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }], // Public STUN for NAT traversal
		});
		this.localStream = null;
		this.remoteAudio = new Audio();
		this.remoteAudio.autoplay = true;

		this.setupPeerEvents();
	}

	async start() {
		// Getting the Microphone Access
		try {
			this.localStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
				video: false,
			});

			// Add local tracks to peer connection
			this.localStream.getTracks().forEach((track) => {
				this.pc.addTrack(track, this.localStream);
			});

			// Attach local stream to preview if needed (optional for voice)
			// const localAudio = new Audio(); localAudio.srcObject = this.localStream; localAudio.play();

			if (this.isCaller) {
				await this.createOffer();
			}
		} catch (err) {
			console.error("Error accessing microphone:", err);
		}
	}

	setupPeerEvents() {
		// Handling the incoming remote tracks
		this.pc.ontrack = (event) => {
			this.remoteAudio.srcObject = event.streams[0];
		};

		// Handling the ICE Candidates (Network info) -> Send via WebSocket
		this.pc.onicecandidate = (event) => {
			if (event.candidate) {
				this.socket.send(
					JSON.stringify({
						type: "ice-candidate",
						candidate: event.candidate,
					}),
				);
			}
		};

		// Handling the Connection State
		this.pc.onconnectionstatechange = () => {
			console.log("Call State:", this.pc.connectionState);
			if (this.pc.connectionState === "connected") {
				console.log("Encrypted Voice Call Established");
			}
			if (
				this.pc.connectionState === "failed" ||
				this.pc.connectionState === "closed"
			) {
				this.endCall();
			}
		};

		// Listening for Signaling Messages from WebSocket
		this.socket.onmessage = async (event) => {
			const message = JSON.parse(event.data);

			if (message.type === "offer" && !this.isCaller) {
				await this.handleOffer(message.offer);
			} else if (message.type === "answer" && this.isCaller) {
				await this.pc.setRemoteDescription(
					new RTCSessionDescription(message.answer),
				);
			} else if (message.type === "ice-candidate") {
				try {
					await this.pc.addIceCandidate(
						new RTCIceCandidate(message.candidate),
					);
				} catch (e) {
					console.error("Error adding received ICE candidate", e);
				}
			}
		};
	}

	async createOffer() {
		const offer = await this.pc.createOffer();
		await this.pc.setLocalDescription(offer);

		// Send Offer via WebSocket
		this.socket.send(
			JSON.stringify({
				type: "offer",
				offer: this.pc.localDescription,
			}),
		);
	}

	async handleOffer(offer) {
		await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
		const answer = await this.pc.createAnswer();
		await this.pc.setLocalDescription(answer);

		// Send Answer via WebSocket
		this.socket.send(
			JSON.stringify({
				type: "answer",
				answer: this.pc.localDescription,
			}),
		);
	}

	endCall() {
		if (this.localStream) {
			this.localStream.getTracks().forEach((track) => track.stop());
		}
		if (this.pc) {
			this.pc.close();
		}
		this.remoteAudio.srcObject = null;
	}
}
