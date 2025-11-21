export type GameEvents = {
    "run-scene": (index: number) => void;
    "scenes-end": () => void;
    "pause": (index: number) => void;
}