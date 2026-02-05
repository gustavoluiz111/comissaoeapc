/**
 * State Management
 * Handles persistence of holidays and schedule overrides.
 */
const State = {
    key: 'comissao_schedule_state_v1',
    data: {
        holidays: {}, // Format: "YYYY-MM-DD": { type: "FERIADO" | "SEM_AULA" | "EVENTO", description: "..." }
        overrides: {}, // Format: "YYYY-MM-DD": ["3A-G1", "3B-G2"] (Array of Group IDs)
        lastUpdated: null
    },

    load() {
        const stored = localStorage.getItem(this.key);
        if (stored) {
            this.data = JSON.parse(stored);
        }
        return this.data;
    },

    save() {
        this.data.lastUpdated = new Date().toISOString();
        localStorage.setItem(this.key, JSON.stringify(this.data));
    },

    setDayStatus(dateStr, type, description = "") {
        if (type === 'AULA_NORMAL') {
            delete this.data.holidays[dateStr];
        } else {
            this.data.holidays[dateStr] = { type, description };
        }
        this.save();
    },

    getDayStatus(dateStr) {
        return this.data.holidays[dateStr] || { type: 'AULA_NORMAL', description: '' };
    },

    reset() {
        localStorage.removeItem(this.key);
        this.data = { holidays: {}, overrides: {} };
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

    generateCalendar(year, groups) {
        State.load();
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
    }
};
