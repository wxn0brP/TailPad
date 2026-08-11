export class AudioEngine {
	private musicChannel: HTMLAudioElement | null = null;
	private soundChannel: HTMLAudioElement | null = null;
	private musicVolume = 1.0;
	private soundVolume = 1.0;

	playMusic(url: string, loop = true, fadeIn = 0): Promise<void> {
		return new Promise(resolve => {
			if (this.musicChannel) {
				this.musicChannel.pause();
				this.musicChannel.src = "";
			}

			this.musicChannel = new Audio(url);
			this.musicChannel.loop = loop;
			this.musicChannel.volume = fadeIn > 0 ? 0 : this.musicVolume;

			this.musicChannel.addEventListener(
				"canplaythrough",
				() => {
					this.musicChannel!.play().catch(console.error);

					if (fadeIn > 0) {
						this.fadeInAudio(this.musicChannel!, fadeIn, this.musicVolume);
					}

					resolve();
				},
				{
					once: true,
				},
			);

			this.musicChannel.addEventListener(
				"error",
				e => {
					console.error("Music load error:", e);
					resolve();
				},
				{
					once: true,
				},
			);

			this.musicChannel.load();
		});
	}

	stopMusic(fadeOut = 0): Promise<void> {
		return new Promise(resolve => {
			if (!this.musicChannel) {
				resolve();
				return;
			}

			if (fadeOut > 0) {
				this.fadeOutAudio(this.musicChannel, fadeOut, () => {
					this.musicChannel!.pause();
					this.musicChannel!.src = "";
					this.musicChannel = null;
					resolve();
				});
			} else {
				this.musicChannel.pause();
				this.musicChannel.src = "";
				this.musicChannel = null;
				resolve();
			}
		});
	}

	playSound(url: string, volume = 1.0): Promise<void> {
		return new Promise(resolve => {
			const audio = new Audio(url);
			audio.volume = volume * this.soundVolume;

			audio.addEventListener(
				"canplaythrough",
				() => {
					audio.play().catch(console.error);
					resolve();
				},
				{
					once: true,
				},
			);

			audio.addEventListener(
				"ended",
				() => {
					resolve();
				},
				{
					once: true,
				},
			);

			audio.addEventListener(
				"error",
				e => {
					console.error("Sound load error:", e);
					resolve();
				},
				{
					once: true,
				},
			);

			audio.load();
		});
	}

	setVolume(channel: "music" | "sound", volume: number): void {
		const clampedVolume = Math.max(0, Math.min(1, volume));

		if (channel === "music") {
			this.musicVolume = clampedVolume;
			if (this.musicChannel) {
				this.musicChannel.volume = clampedVolume;
			}
		} else {
			this.soundVolume = clampedVolume;
		}
	}

	private fadeInAudio(
		audio: HTMLAudioElement,
		duration: number,
		targetVolume: number,
	): void {
		const steps = 20;
		const stepDuration = duration / steps;
		const volumeStep = targetVolume / steps;
		let currentStep = 0;

		const interval = setInterval(() => {
			currentStep++;
			audio.volume = Math.min(volumeStep * currentStep, targetVolume);

			if (currentStep >= steps) {
				clearInterval(interval);
			}
		}, stepDuration);
	}

	private fadeOutAudio(
		audio: HTMLAudioElement,
		duration: number,
		callback: () => void,
	): void {
		const steps = 20;
		const stepDuration = duration / steps;
		const startVolume = audio.volume;
		const volumeStep = startVolume / steps;
		let currentStep = 0;

		const interval = setInterval(() => {
			currentStep++;
			audio.volume = Math.max(startVolume - volumeStep * currentStep, 0);

			if (currentStep >= steps) {
				clearInterval(interval);
				callback();
			}
		}, stepDuration);
	}

	dispose(): void {
		if (this.musicChannel) {
			this.musicChannel.pause();
			this.musicChannel.src = "";
			this.musicChannel = null;
		}
		if (this.soundChannel) {
			this.soundChannel.pause();
			this.soundChannel.src = "";
			this.soundChannel = null;
		}
	}
}
