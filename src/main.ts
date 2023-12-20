import { BotFactory } from "./Bot";
import { Utils } from "./Utils";
import { WordPoolFactory } from "./Word";
import { log } from "./Log";

(() => {
	console.log(`

================================================================================

oooooooooo.  ooooooooo.   ooooo     ooo ooooooooooooo ooooo        oooooooooooo 
\`888'   \`Y8b \`888   \`Y88. \`888'     \`8' 8'   888   \`8 \`888'        \`888'     \`8 
 888     888  888   .d88'  888       8       888       888          888         
 888oooo888'  888ooo88P'   888       8       888       888          888oooo8    
 888    \`88b  888\`88b.     888       8       888       888          888    "    
 888    .88P  888  \`88b.   \`88.    .8'       888       888       o  888       o 
o888bood8P'  o888o  o888o    \`YbodP'        o888o     o888ooooood8 o888ooooood8 

version 1.0 - https://github.com/daemon-ic/
================================================================================
`);
})();

const AMT_OF_GUESSES = 6;



async function main() {
	const words = await WordPoolFactory.fetch();

	let gameWon = false;

	while (!gameWon) {
		const bot = await BotFactory.create(
			"https://www.nytimes.com/games/wordle/index.html"
		);

		try {
			await bot.init();
			await bot.beginGame();

			let round = 1;

			while (round <= AMT_OF_GUESSES && !gameWon) {
				const guess = words.getGuess();

				log.debug("CURRENT GUESS: " + guess);

				await bot.playWord(guess);

				log.trace("EVALUATING...")
				await Utils.sleep(2500);

				const letterStates = await bot.getLetterStates(round);
				gameWon = bot.winState;

				if (gameWon) break;

				words.updatePool(letterStates)
				round++;
			}
		} catch (e: any) {
			console.log(e);
		} finally {
			await bot.close();
		}

		gameWon ? log.info("✨ VICTORY") : log.error("DEFEAT. CONTINUING ON NEW BROWSER");
	}
}

main();
