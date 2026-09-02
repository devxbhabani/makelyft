// Lightweight event emitter for global custom Odoo alerts
const alertListeners = [];

export const showAlert = (message, title = "Notification", type = "info") => {
    alertListeners.forEach(listener => listener({ message, title, type }));
};

export const subscribeAlert = (listener) => {
    alertListeners.push(listener);
    return () => {
        const index = alertListeners.indexOf(listener);
        if (index > -1) alertListeners.splice(index, 1);
    };
};
