export class VoiceCall {
    constructor(socket, rideId, isCaller, onStateChange) {
        this.socket = socket; 
        this.rideId = rideId;
        this.isCaller = isCaller;
        this.onStateChange = onStateChange;
        
        this.pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }] // Public STUN for NAT traversal
        });
        this.localStream = null;
        this.remoteAudio = new Audio();
        this.remoteAudio.autoplay = true;
        this.isMuted = false;
        
        this.setupPeerEvents();
    }

    async start() {
        try {
            // Request microphone access
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true, 
                    autoGainControl: true 
                }, 
                video: false 
            });
            
            // Add local tracks to peer connection
            this.localStream.getTracks().forEach(track => {
                this.pc.addTrack(track, this.localStream);
            });

            if (this.isCaller) {
                await this.createOffer();
            }
        } catch (err) {
            console.error("Error accessing microphone:", err);
            if (this.onStateChange) this.onStateChange("failed");
        }
    }

    setupPeerEvents() {
        // Handling incoming remote tracks
        this.pc.ontrack = (event) => {
            this.remoteAudio.srcObject = event.streams[0];
        };

        // Handling ICE Candidates (Send via Socket.io)
        this.pc.onicecandidate = (event) => {
            if (event.candidate && this.socket) {
                this.socket.emit("voice_signal", {
                    ride_id: this.rideId,
                    type: "ice-candidate",
                    candidate: event.candidate
                });
            }
        };

        // Handling Connection State
        this.pc.onconnectionstatechange = () => {
            console.log("[WebRTC Voice] State:", this.pc.connectionState);
            if (this.onStateChange) {
                this.onStateChange(this.pc.connectionState);
            }
            if (this.pc.connectionState === "failed" || this.pc.connectionState === "closed") {
                this.endCall();
            }
        };

        // Listening for Socket.io signaling messages
        if (this.socket) {
            this.handleSignal = async (message) => {
                if (message.type === "offer" && !this.isCaller) {
                    await this.handleOffer(message.offer);
                } 
                else if (message.type === "answer" && this.isCaller) {
                    await this.pc.setRemoteDescription(new RTCSessionDescription(message.answer));
                } 
                else if (message.type === "ice-candidate") {
                    try {
                        await this.pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                    } catch (e) {
                        console.error("Error adding received ICE candidate", e);
                    }
                } else if (message.type === "end-call") {
                    this.endCall();
                }
            };

            this.socket.on("voice_signal", this.handleSignal);
        }
    }

    async createOffer() {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        
        if (this.socket) {
            this.socket.emit("voice_signal", {
                ride_id: this.rideId,
                type: "offer",
                offer: this.pc.localDescription
            });
        }
    }

    async handleOffer(offer) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        if (this.socket) {
            this.socket.emit("voice_signal", {
                ride_id: this.rideId,
                type: "answer",
                answer: this.pc.localDescription
            });
        }
    }

    toggleMute() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.isMuted = !audioTrack.enabled;
                return this.isMuted;
            }
        }
        return false;
    }

    endCall() {
        if (this.socket) {
            this.socket.emit("voice_signal", {
                ride_id: this.rideId,
                type: "end-call"
            });
            if (this.handleSignal) {
                this.socket.off("voice_signal", this.handleSignal);
            }
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.pc) {
            this.pc.close();
        }
        this.remoteAudio.srcObject = null;
        if (this.onStateChange) this.onStateChange("closed");
    }
}
