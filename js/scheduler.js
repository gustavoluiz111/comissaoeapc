/**
 * State Management
 * Handles persistence of holidays and schedule overrides.
 * Supports: LocalStorage (Default) and Firebase Firestore (if configured).
 */
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
                this.useFirebase = true;
                console.log("State: Using Firebase Firestore");
            } catch (e) {
                console.error("Firebase Init Error:", e);
                this.useFirebase = false;
            }
        } else {
            console.log("State: Using LocalStorage (Firebase keys not found)");
        }

        await this.load();
    },

    async load() {
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
                // Fallback to local on error? Maybe not to avoid sync issues.
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
                alert("Erro ao salvar no servidor. Verifique sua conexão.");
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
    // 11 Groups * 2 days/week = 22 slots per week.
    // Week distribution pattern: [5, 5, 4, 4, 4] = 22 slots.
    // Cycle: Mon(5), Tue(5), Wed(4), Thu(4), Fri(4).
    slotsPerWeekDay: [5, 5, 4, 4, 4], // Index 0 = Mon, 4 = Fri

    async generateCalendar(year, groups) {
        await State.init(); // Ensure data is loaded
        const schedule = {};
        const startDate = new Date(year, 0, 1); // Jan 1st
        const endDate = new Date(year, 11, 31); // Dec 31st

        // Create a queue of groups where each appears 2 times
        // To ensure fair distribution, we interleave them or just double the array?
        // Let's create a robust queue: [G1...G11, G1...G11] shuffled or sorted?
        // Sorted ensures G1 is Mon/Wed, G2 Mon/Thu etc. consistently.
        // Let's keep it sorted for predictability, or simple rotation.
        let queue = [];

        // Helper to refill queue
        const refillQueue = () => {
            // Create 2 instances of each group
            let batch = [];
            groups.forEach(g => {
                batch.push(g);
                batch.push(g);
            });
            // We return them in order. 
            // To prevent the same group appearing on the same day if possible, 
            // we might need a smarter distribution if the daily capacity > total groups (not the case here, 5 < 11).
            return batch;
        };

        queue = refillQueue();

        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay(); // 0=Sun, 6=Sat

            // Check if it's a school day (Mon-Fri)
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                const status = State.getDayStatus(dateStr);

                if (status.type === 'AULA_NORMAL') {
                    // It's a school day. Determine how many slots needed.
                    // Mon(1)..Fri(5) -> Array index 0..4
                    const slotsNeeded = this.slotsPerWeekDay[dayOfWeek - 1];

                    const daysGroups = [];

                    for (let i = 0; i < slotsNeeded; i++) {
                        if (queue.length === 0) {
                            queue = refillQueue();
                        }
                        daysGroups.push(queue.shift());
                    }

                    schedule[dateStr] = {
                        type: 'AULA_NORMAL',
                        groups: daysGroups
                    };
                } else {
                    // Holiday / No Class
                    schedule[dateStr] = {
                        type: status.type,
                        description: status.description,
                        groups: []
                    };
                    // Note: We do NOT consume the queue, so groups are pushed to the next valid day.
                    // This satisfies: "Reorganizar automaticamente a escala da semana."
                }
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
        // Generate whole year (cached ideally, but fast enough)
        const fullSchedule = await this.generateCalendar(year, ALL_GROUPS);

        // Find Monday of the current week
        const day = inputDate.getDay(); // 0 (Sun) - 6 (Sat)
        const diff = inputDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(inputDate.setDate(diff));

        const weekData = [];
        const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

        for (let i = 0; i < 5; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
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
