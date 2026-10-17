import { RandomBranch } from "./types";

export function pickRandomBranch(branches?: RandomBranch[]) {
	if (!branches?.length) return undefined;

	const total = branches.reduce((sum, branch) => sum + (branch.weight ?? 1), 0);
	if (total <= 0) return branches[0].scene;

	let roll = Math.random() * total;
	for (const branch of branches) {
		roll -= branch.weight ?? 1;
		if (roll < 0) return branch.scene;
	}
	return branches[branches.length - 1].scene;
}
