import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		allowedHosts: true,
		proxy: {
			"/auth": "http://localhost:3000",
			"/chat": "http://localhost:3000",
			"/profile": "http://localhost:3000",
			"/feedback": "http://localhost:3000",
			"/uploads": "http://localhost:3000",
			"/rides": "http://localhost:3000",
			"/register-vehicle": "http://localhost:3000",
			"/publish-ride": "http://localhost:3000",
			"/book-ride": "http://localhost:3000",
			"/pickup-ride": "http://localhost:3000",
			"/drop-passenger": "http://localhost:3000",
			"/admin": "http://localhost:3000",
			"/wallet": "http://localhost:3000",
			"/finish-ride": "http://localhost:3000",
			"/history": "http://localhost:3000",
			"/rate": "http://localhost:3000",
			"/socket.io": {
				target: "http://localhost:3000",
				ws: true,
			},
		},
	},
});
