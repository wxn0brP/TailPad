const SAVE_KEY = "tailpad-game-saves";
const MAX_SAVES = 5;

export interface SaveData {
    sceneName: string;
    lastIndex: number;
    timestamp: number;
}

export type SaveFile = (SaveData | null)[];

export function getSaves(): SaveFile {
    try {
        const json = localStorage.getItem(SAVE_KEY);
        if (json) {
            const data = JSON.parse(json) as SaveFile;
            while (data.length < MAX_SAVES) {
                data.push(null);
            }
            return data.slice(0, MAX_SAVES);
        }
    } catch (error) {
        console.error("Error loading saves:", error);
    }
    return new Array(MAX_SAVES).fill(null);
}

export function saveGameToSlot(slotIndex: number, data: Omit<SaveData, "timestamp">) {
    if (slotIndex < 0 || slotIndex >= MAX_SAVES) {
        console.error(`Invalid save slot: ${slotIndex}`);
        return;
    }
    const saves = getSaves();
    saves[slotIndex] = {
        ...data,
        timestamp: Date.now(),
    };
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
        console.log(`Game saved to slot ${slotIndex}!`, saves[slotIndex]);
    } catch (error) {
        console.error("Error saving game:", error);
    }
}

export function clearSave(slotIndex: number) {
    if (slotIndex < 0 || slotIndex >= MAX_SAVES) {
        console.error(`Invalid save slot: ${slotIndex}`);
        return;
    }
    const saves = getSaves();
    saves[slotIndex] = null;
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
        console.log(`Save data for slot ${slotIndex} cleared.`);
    } catch (error) {
        console.error("Error clearing save:", error);
    }
}
