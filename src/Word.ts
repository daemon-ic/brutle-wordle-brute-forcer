import axios from "axios";
import fs from "fs";
import { log } from "./Log";
import path from "path";
import { Utils } from "./Utils";

class Words {
	pool: string[];
	used: string[] = [];
	starters: string[] = ["pound", "twice", "twine", "rainy", "cries"];
	initial = true;

	constructor(pool: string[]) {
		this.pool = pool;
	}

	print() {
		console.log(this.pool);
	}

	getStarter() {
		const randomIdx = Utils.getRandomNumberBetween(
			0,
			this.starters.length - 1
		);
		return this.starters[randomIdx];
	}

	private wordHasAllCorrectLetters(word: string, correctLetterData: any) {
		for (const letter in correctLetterData) {
			if (!word.includes(letter)) return false;

			const correctIdxs = correctLetterData[letter].doesExistOn;
			for (const idx of correctIdxs) {
				if (word[idx] !== letter) return false;
			}
		}
		return true;
	}

	private wordHasAllPresentLetters(word: string, presentLetterData: any) {
		for (const letter in presentLetterData) {
			if (!word.includes(letter)) return false;
		}

		for (const letter in presentLetterData) {
			const presentIdxs = presentLetterData[letter].doesNotExistOn;
			for (const idx of presentIdxs) {
				if (word[idx] === letter) return false;
			}
		}

		return true;
	}

	updatePool(lettersThatAre: { [key: string]: any }) {
		if (Object.keys(lettersThatAre.correct).length > 0) {
			this.pool = this.pool.filter((word) => {
				return this.wordHasAllCorrectLetters(
					word,
					lettersThatAre.correct
				);
			});
		}

		if (Object.keys(lettersThatAre.present).length > 0) {
			this.pool = this.pool.filter((word) => {
				return this.wordHasAllPresentLetters(
					word,
					lettersThatAre.present
				);
			});
		}

		if (lettersThatAre.absent.length > 0) {
			this.pool = this.pool.filter((word) => {
				for (const absentLetter of lettersThatAre.absent) {
					if (word.includes(absentLetter)) return false;
				}
				return true;
			});
		}
	}

	getGuess() {
		if (this.initial) {
			this.initial = false;
			return this.getStarter();
		} else {
			const randomIdx = Utils.getRandomNumberBetween(
				0,
				this.pool.length - 1
			);
			return this.pool[randomIdx];
		}
	}
}

export class WordPoolFactory {
	private static cachePath = path.join(__dirname, "..", "/cache.json");

	static async fetch() {
		try {
			const wordPool = this.retrieveCache();
			return new Words(wordPool);
		} catch (e: any) {
			const newWordPool = await this.getNewWords({
				qty: 99999999,
				length: 5,
			});
			this.cacheWords(newWordPool);
			return new Words(newWordPool);
		}
	}

	private static cacheWords(words: string[]) {
		log.debug("CACHING NEW WORDS");
		fs.writeFileSync(this.cachePath, JSON.stringify(words));
	}

	private static retrieveCache() {
		log.trace("RETRIEVING CACHE");
		const cachedJson = fs.readFileSync(this.cachePath, "utf8");
		return JSON.parse(cachedJson);
	}

	private static async getNewWords({
		qty,
		length,
	}: {
		qty: number;
		length: number;
	}) {
		log.debug("FETCHING NEW WORDS");
		const uri = `https://random-word-api.herokuapp.com/word?length=${length}&number=${qty}`;
		const response = await axios.get(uri);
		return response.data;
	}
}
