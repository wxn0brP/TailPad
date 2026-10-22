export interface MusicState {
	url: string;
	loop: boolean;
	currentTime: number;
}

export class AudioEngine {
	private musicChannel: HTMLAudioElement | null = null;
	private musicUrl: string | null = null;
	private musicLoop = true;
	private musicVolume = 1.0;
	private soundVolume = 1.0;
	private sounds = new Map<HTMLAudioElement, number>();

	playMusic(
		url: string,
		loop = true,
		fadeIn = 0,
		force = false,
	): Promise<void> {
		if (!url || typeof url !== "string") {
			console.error("AudioEngine: invalid url", url);
			return Promise.resolve();
		}

		if (!force && this.musicChannel && this.musicUrl === url) {
			this.musicLoop = loop;
			this.musicChannel.loop = loop;
			if (this.musicChannel.paused)
				this.musicChannel.play().catch(console.error);
			return Promise.resolve();
		}

		return new Promise(resolve => {
			this.resetMusic();

			const audio = new Audio(url);
			this.musicChannel = audio;
			this.musicUrl = url;
			this.musicLoop = loop;
			audio.loop = loop;
			audio.volume = fadeIn > 0 ? 0 : this.musicVolume;

			audio.addEventListener(
				"canplaythrough",
				() => {
					audio.play().catch(console.error);

					if (fadeIn > 0) {
						this.fadeInAudio(audio, fadeIn, this.musicVolume);
					}

					resolve();
				},
				{
					once: true,
				},
			);

			audio.addEventListener(
				"error",
				e => {
					console.error("Music load error:", e);
					if (this.musicChannel === audio) {
						this.musicChannel = null;
						this.musicUrl = null;
					}
					resolve();
				},
				{
					once: true,
				},
			);

			audio.load();
		});
	}

	stopMusic(fadeOut = 0): Promise<void> {
		return new Promise(resolve => {
			const channel = this.musicChannel;
			if (!channel) {
				this.musicUrl = null;
				resolve();
				return;
			}

			this.musicUrl = null;
			this.musicLoop = true;

			const finish = () => {
				channel.pause();
				channel.src = "";
				if (this.musicChannel === channel) this.musicChannel = null;
				resolve();
			};

			if (fadeOut > 0) this.fadeOutAudio(channel, fadeOut, finish);
			else finish();
		});
	}

	playSound(url: string, volume = 1.0): Promise<void> {
		if (!url || typeof url !== "string") {
			console.error("AudioEngine: invalid url", url);
			return Promise.resolve();
		}

		return new Promise(resolve => {
			const audio = new Audio(url);
			this.sounds.set(audio, volume);
			audio.volume = volume * this.soundVolume;

			const forget = () => {
				this.sounds.delete(audio);
				audio.src = "";
			};

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
					forget();
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
					forget();
					resolve();
				},
				{
					once: true,
				},
			);

			audio.load();
		});
	}

	/** Snapshot of the background music, used by the save system. */
	getMusicState(): MusicState | null {
		if (!this.musicChannel || !this.musicUrl) return null;
		return {
			url: this.musicUrl,
			loop: this.musicLoop,
			currentTime: this.musicChannel.currentTime || 0,
		};
	}

	async restoreMusic(state?: MusicState | null) {
		if (!state?.url) {
			await this.stopMusic();
			return;
		}

		if (this.musicChannel && this.musicUrl === state.url) {
			this.musicLoop = state.loop ?? true;
			this.musicChannel.loop = this.musicLoop;
			if (this.musicChannel.paused)
				await this.musicChannel.play().catch(console.error);
			if (state.currentTime > 0)
				this.musicChannel.currentTime = state.currentTime;
			return;
		}

		await this.playMusic(state.url, state.loop ?? true, 0, true);
		if (this.musicChannel && state.currentTime > 0)
			this.musicChannel.currentTime = state.currentTime;
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
			for (const [audio, baseVolume] of this.sounds) {
				audio.volume = baseVolume * clampedVolume;
			}
		}
	}

	private resetMusic(): void {
		if (!this.musicChannel) return;
		this.musicChannel.pause();
		this.musicChannel.src = "";
		this.musicChannel = null;
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
		this.resetMusic();
		this.musicUrl = null;
		this.musicLoop = true;
		for (const audio of this.sounds.keys()) {
			audio.pause();
			audio.src = "";
		}
		this.sounds.clear();
	}
}
