import VEE from "@wxn0brp/event-emitter";

export class VariableManager {
	private variables: Map<string, string | number | boolean> = new Map();
	private _emitter = new VEE<{
		change: () => void;
	}>();

	subscribe(cb: () => void) {
		this._emitter.on("change", cb);
		return () => this._emitter.off("change", cb);
	}

	set(
		name: string,
		value: string | number | boolean,
		operation: "set" | "add" | "subtract" | "multiply" | "divide" = "set",
	) {
		if (operation === "set") {
			this.variables.set(name, value);
			this._emitter.emit("change");
			return;
		}

		const current = this.variables.get(name);
		if (current === undefined) {
			this.variables.set(name, value);
			this._emitter.emit("change");
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
			this._emitter.emit("change");
		}
	}

	get(name: string) {
		return this.variables.get(name);
	}

	evaluate(
		variableName: string,
		operator: "==" | "!=" | ">" | "<" | ">=" | "<=",
		compareValue: string | number | boolean,
	) {
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

	setAll(values: Record<string, string | number | boolean>) {
		this.variables.clear();
		for (const [key, value] of Object.entries(values ?? {})) {
			this.variables.set(key, value);
		}
		this._emitter.emit("change");
	}

	clear() {
		this.variables.clear();
		this._emitter.emit("change");
	}

	delete(name: string) {
		this.variables.delete(name);
		this._emitter.emit("change");
	}
}
