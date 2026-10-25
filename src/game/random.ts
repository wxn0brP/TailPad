import { RandomBranch } from "./types";

export function pickRandomIndex(branches?: RandomBranch[]) {
	if (!branches?.length) return -1;

	const total = branches.reduce((sum, branch) => sum + (branch.weight ?? 1), 0);
	if (total <= 0) return 0;

	let roll = Math.random() * total;
	for (let i = 0; i < branches.length; i++) {
		roll -= branches[i].weight ?? 1;
		if (roll < 0) return i;
	}
	return branches.length - 1;
}
