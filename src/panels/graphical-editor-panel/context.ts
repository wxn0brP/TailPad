let knownScenes: string[] = [];

export function setKnownScenes(scenes: string[]) {
	knownScenes = scenes;
}

export function getKnownScenes() {
	return knownScenes;
}
