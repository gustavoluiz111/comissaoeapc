/**
 * State Management
 * Handles persistence of holidays and schedule overrides.
 * Supports: LocalStorage (Default) and Firebase Firestore (if configured).
 */
const HARDCODED_HOLIDAYS = {
    "2026-02-12": { type: "SEM_AULA", description: "Carnaval Chuvoso" },
    "2026-02-13": { type: "FERIADO", description: "Feriado" },
    "2026-02-16": { type: "FERIADO", description: "Feriado" },
    "2026-02-17": { type: "FERIADO", description: "Feriado" },
    "2026-02-18": { type: "FERIADO", description: "Feriado" }
};

const State = {
    key: 'comissao_schedule_state_v1',
    useFirebase: false,
    db: null,
    data: {
        holidays: {},
        overrides: {},
        lastUpdated: null
    },

    async init() {
        // Check if Firebase is available and configured
        if (typeof firebase !== 'undefined' && window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey !== "SUA_API_KEY_AQUI") {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(window.FIREBASE_CONFIG);
                }
                this.db = firebase.firestore();
                // Enable offline persistence if possible
                try {
                    await this.db.enablePersistence();
                } catch (err) {
                    if (err.code == 'failed-precondition') {
                        console.warn('Persistence failed: Multiple tabs open');
                    } else if (err.code == 'unimplemented') {
                        console.warn('Persistence not supported by browser');
                    }
                }

                this.useFirebase = true;
                console.log("State: Connected to Firebase Firestore", this.data);
            } catch (e) {
                console.error("Firebase Init Error:", e);
                this.useFirebase = false;
                alert("Erro ao conectar com Firebase. O sistema funcionará Offline.");
            }
        } else {
            console.log("State: Using LocalStorage (Firebase keys not found or library missing)");
            if (typeof firebase === 'undefined') console.error("Firebase library not loaded inside scheduler.js");
        }

        await this.load();
    },

    async load() {
        this.data = { holidays: {}, overrides: {}, lastUpdated: null }; // Reset to avoid stale merge issues
        if (this.useFirebase) {
            try {
                const doc = await this.db.collection('config').doc('schedule').get();
                if (doc.exists) {
                    this.data = doc.data();
                } else {
                    // Initialize if empty
                    await this.save();
                }
            } catch (e) {
                console.error("Error loading from Firebase:", e);
            }
        } else {
            const stored = localStorage.getItem(this.key);
            if (stored) {
                this.data = JSON.parse(stored);
            }
        }
        return this.data;
    },

    async save() {
        this.data.lastUpdated = new Date().toISOString();

        if (this.useFirebase) {
            try {
                await this.db.collection('config').doc('schedule').set(this.data);
            } catch (e) {
                console.error("Error saving to Firebase:", e);
                alert(`Erro ao salvar no servidor (Firebase):\n${e.code}\n${e.message}\n\nVerifique se as Regras de Segurança do Firestore não expiraram.`);
            }
        } else {
            localStorage.setItem(this.key, JSON.stringify(this.data));
        }
    },

    async setDayStatus(dateStr, type, description = "") {
        if (type === 'AULA_NORMAL') {
            if (this.data.holidays && this.data.holidays[dateStr]) {
                delete this.data.holidays[dateStr];
            }
        } else {
            this.data.holidays = this.data.holidays || {};
            this.data.holidays[dateStr] = { type, description };
        }
        await this.save();
    },

    getDayStatus(dateStr) {
        // Priority: Hardcoded > Database/Local > Normal
        if (HARDCODED_HOLIDAYS[dateStr]) {
            return HARDCODED_HOLIDAYS[dateStr];
        }
        return (this.data.holidays && this.data.holidays[dateStr]) || { type: 'AULA_NORMAL', description: '' };
    },

    reset() {
        if (confirm("Resetar locais e remotos?")) {
            localStorage.removeItem(this.key);
            this.data = { holidays: {}, overrides: {} };
            if (this.useFirebase) this.save();
        }
    }
};


/**
 * Scheduler Logic
 * Distributes groups across days.
 */
const Scheduler = {
    // New Configuration: 1 Group per Day, 2 Consecutive Days.
    // Cycle: G1, G1, G2, G2, ..., G11, G11 -> Repeat.

    // Helper for safe local dates YYYY-MM-DD
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    async generateCalendar(year, groups) {
        await State.init(); // Ensure data is loaded
        const schedule = {};
        const startDate = new Date(year, 0, 1); // Jan 1st
        const endDate = new Date(year, 11, 31); // Dec 31st

        let queue = [];

        const refillQueue = () => {
            // Fill queue with 2 instances of each group in order
            let batch = [];
            groups.forEach(g => {
                batch.push(g);
                batch.push(g); // 2 consecutive days
            });
            return batch;
        };

        queue = refillQueue();

        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            // Safe Date String using local components
            const dateStr = this.formatDate(currentDate);
            const dayOfWeek = currentDate.getDay(); // 0=Sun, 6=Sat

            // Check if it's a school day (Mon-Fri)
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                const status = State.getDayStatus(dateStr);

                if (status.type === 'AULA_NORMAL') {
                    // Assign ONE group from queue
                    if (queue.length === 0) {
                        queue = refillQueue();
                    }

                    const group = queue.shift();

                    schedule[dateStr] = {
                        type: 'AULA_NORMAL',
                        groups: [group]
                    };
                } else {
                    // Holiday / No Class
                    // Queue is NOT consumed. Flow pauses.
                    schedule[dateStr] = {
                        type: status.type,
                        description: status.description,
                        groups: []
                    };
                }
            } else {
                // Weekends - do nothing particular, just existing logic is fine.
            }

            // Next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return schedule;
    },

    /**
     * Returns the schedule for the week containing the given date.
     * Returns array of { date: Date, dateStr: string, dayName: string, events: [] }
     */
    async getWeekSchedule(inputDate = new Date()) {
        await State.init();
        const year = inputDate.getFullYear();
        const fullSchedule = await this.generateCalendar(year, ALL_GROUPS);

        // Find Monday of the current week (Sunday is 0)
        const day = inputDate.getDay();
        const diff = inputDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(inputDate);
        monday.setDate(diff);

        const weekData = [];
        const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

        for (let i = 0; i < 5; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateStr = this.formatDate(d);
            const ptDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); // DD/MM

            if (fullSchedule[dateStr]) {
                weekData.push({
                    dayName: days[i],
                    dateStr: ptDate,
                    fullDate: dateStr,
                    data: fullSchedule[dateStr]
                });
            }
        }
        return weekData;
    }
};
