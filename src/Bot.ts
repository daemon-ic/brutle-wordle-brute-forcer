import puppeteer, { Browser, Page } from "puppeteer";
import { log } from "./Log";
import { Utils } from "./Utils";

export class BotFactory {
	static async create(site: string) {
		const browser = await puppeteer.launch({
			headless: "new",
		});
		const page = await browser.newPage();
		return new Bot(browser, page, site);
	}
}

class Bot {
	site: string;
	page: Page;
	browser: Browser;
	winState = false;

	constructor(browser: Browser, page: Page, site: string) {
		this.browser = browser;
		this.page = page;
		this.site = site;
	}

	private async click(selector: string) {
		await this.page.waitForSelector(selector, { visible: true });
		await this.page.click(selector);
	}

	private async getAbsentLetters() {
		const allButtons = await this.page.$$("button");

		const absentLetters = [];

		for (const button of allButtons) {
			const buttonDetails = await button.evaluate((element) =>
				element.getAttribute("aria-label")
			);

			if (buttonDetails?.includes(" absent")) {
				absentLetters.push(buttonDetails.split(" ")[0]);
			}
		}
		return absentLetters;
	}

	private async getLetterStatesFromRow(round: number) {
		const present: { [letter: string]: any } = {};
		const correct: { [letter: string]: any } = {};
		let winCounter = 0;

		const row = await this.page.$(`div[aria-label="Row ${round}"]`);

		if (!row) return { present, correct };

		const tiles = await row.$$(".Tile-module_tile__UWEHN");

		for (const tile of tiles) {
			const label = await tile.evaluate((element) =>
				element.getAttribute("aria-label")
			);
			if (!label) throw new Error("ERROR READING TILES");

			const [rawPlace, rawletter, rawState] = label.split(",");

			const idx = Number(rawPlace.trim()[0]) - 1;
			const letter = rawletter.trim().toLowerCase();
			const state = rawState.trim().split(" ")[0];
			this.display(letter, state);

			if (state === "absent") continue;

			if (state === "present") {
				!present.hasOwnProperty(letter)
					? (present[letter] = { doesNotExistOn: [idx] })
					: (present[letter] = {
							doesNotExistOn: [
								...present[letter].doesNotExistOn,
								idx,
							],
					  });
			}

			if (state === "correct") {
				winCounter++;
				!correct.hasOwnProperty(letter)
					? (correct[letter] = { doesExistOn: [idx] })
					: (correct[letter] = {
							doesExistOn: [...correct[letter].doesExistOn, idx],
					  });
			}
		}

		if (winCounter === 5) this.winState = true;
		return { present, correct };
	}

	async init() {
		log.trace("PAGE INIT");
		await this.page.goto(this.site, {
			waitUntil: "networkidle2",
		});
	}

	async beginGame() {
		await this.click('button[data-testid="Play"]');
		await this.click('button[aria-label="Close"]');
	}

	async display(letter: string, state: string) {
		const displayDict: { [key: string]: string } = {
			absent: "✖️",
			present: "🟨",
			correct: "🟩",
		};
		console.log(` ${displayDict[state]}  ${letter.toUpperCase()} - ${state}`);
	}

	async playWord(word: string) {
		if (word.length !== 5) {
			log.error("INVALID WORD LENGTH");
			return;
		}
		for (let i = 0; i < word.length; i++) {
			const letter = word[i];
			await Utils.sleep(250);
			await this.click('button[data-key="' + letter + '"]');
		}
		await this.click('button[aria-label="enter"]');
	}

	async getLetterStates(round: number) {
		const absent = await this.getAbsentLetters();
		const { present, correct } = await this.getLetterStatesFromRow(round);
		return { absent, present, correct };
	}

	async close() {
		log.trace("CLOSING BROWSER");
		this.browser.close();
	}
}
