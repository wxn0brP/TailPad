export class VariableManager {
	private variables: Map<string, string | number | boolean> = new Map();

	set(
		name: string,
		value: string | number | boolean,
		operation: "set" | "add" | "subtract" | "multiply" | "divide" = "set",
	): void {
		if (operation === "set") {
			this.variables.set(name, value);
			return;
		}

		const current = this.variables.get(name);
		if (current === undefined) {
			this.variables.set(name, value);
			return;
		}

		if (typeof current === "number" && typeof value === "number") {
			switch (operation) {
				case "add":
					this.variables.set(name, current + value);
					break;
				case "subtract":
					this.variables.set(name, current - value);
					break;
				case "multiply":
					this.variables.set(name, current * value);
					break;
				case "divide":
					this.variables.set(name, value !== 0 ? current / value : current);
					break;
			}
		}
	}

	get(name: string): string | number | boolean | undefined {
		return this.variables.get(name);
	}

	evaluate(
		variableName: string,
		operator: "==" | "!=" | ">" | "<" | ">=" | "<=",
		compareValue: string | number | boolean,
	): boolean {
		const currentValue = this.variables.get(variableName);
		if (currentValue === undefined) {
			return false;
		}

		switch (operator) {
			case "==":
				return currentValue === compareValue;
			case "!=":
				return currentValue !== compareValue;
			case ">":
				return (
					typeof currentValue === "number" &&
					typeof compareValue === "number" &&
					currentValue > compareValue
				);
			case "<":
				return (
					typeof currentValue === "number" &&
					typeof compareValue === "number" &&
					currentValue < compareValue
				);
			case ">=":
				return (
					typeof currentValue === "number" &&
					typeof compareValue === "number" &&
					currentValue >= compareValue
				);
			case "<=":
				return (
					typeof currentValue === "number" &&
					typeof compareValue === "number" &&
					currentValue <= compareValue
				);
			default:
				return false;
		}
	}

	getAll(): Record<string, string | number | boolean> {
		const result: Record<string, string | number | boolean> = {};
		this.variables.forEach((value, key) => {
			result[key] = value;
		});
		return result;
	}

	clear(): void {
		this.variables.clear();
	}

	delete(name: string): void {
		this.variables.delete(name);
	}
}
