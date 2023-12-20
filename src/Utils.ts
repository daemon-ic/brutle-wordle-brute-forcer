export class Utils {
	static async sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	static getRandomNumberBetween(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
}
