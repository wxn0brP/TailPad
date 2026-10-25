import { getKnownScenes } from "./context";

export function createField(label: string, input: HTMLElement) {
	const field = document.createElement("div");
	field.className = "field";
	const labelEl = document.createElement("label");
	labelEl.textContent = label;
	field.appendChild(labelEl);
	field.appendChild(input);
	return field;
}

export function createSelectField(
	key: string,
	value: string,
	options: string[],
	onChange: (value: string) => void,
) {
	const select = document.createElement("select");
	options.forEach(opt => {
		const option = document.createElement("option");
		option.value = opt;
		option.textContent = opt;
		if (opt === value) {
			option.selected = true;
		}
		select.appendChild(option);
	});
	select.addEventListener("change", e =>
		onChange((e.target as HTMLSelectElement).value),
	);
	return createField(key, select as unknown as HTMLElement);
}

export function createTextField(
	key: string,
	value: string,
	onChange: (value: string) => void,
) {
	const input = document.createElement("input");
	input.type = "text";
	input.value = value || "";
	input.addEventListener("change", e =>
		onChange((e.target as HTMLInputElement).value),
	);
	return createField(key, input);
}

export function createTextareaField(
	key: string,
	value: string,
	onChange: (value: string) => void,
) {
	const textarea = document.createElement("textarea");
	textarea.className = "field-textarea";
	textarea.value = value || "";
	textarea.rows = 2;
	textarea.addEventListener("change", e =>
		onChange((e.target as HTMLTextAreaElement).value),
	);
	return createField(key, textarea);
}

export function createNumberField(
	key: string,
	value: number,
	onChange: (value: number) => void,
) {
	const input = document.createElement("input");
	input.type = "number";
	input.value = String(value || 0);
	input.addEventListener("change", e =>
		onChange(Number((e.target as HTMLInputElement).value)),
	);
	return createField(key, input);
}

export function createBooleanField(
	key: string,
	value: boolean,
	onChange: (value: boolean) => void,
) {
	const input = document.createElement("input");
	input.type = "checkbox";
	input.checked = value || false;
	input.addEventListener("change", e =>
		onChange((e.target as HTMLInputElement).checked),
	);
	return createField(key, input);
}

let datalistId = 0;

export function createSceneField(
	key: string,
	value: string,
	onChange: (value: string) => void,
) {
	const input = document.createElement("input");
	input.type = "text";
	input.value = value || "";
	const listId = `scene-options-${++datalistId}`;
	input.setAttribute("list", listId);

	const datalist = document.createElement("datalist");
	datalist.id = listId;
	for (const scene of getKnownScenes()) {
		const option = document.createElement("option");
		option.value = scene;
		datalist.appendChild(option);
	}

	input.addEventListener("change", e =>
		onChange((e.target as HTMLInputElement).value),
	);

	const field = createField(key, input);
	field.appendChild(datalist);
	return field;
}
