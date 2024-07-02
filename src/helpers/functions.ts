import { StateUpdater } from 'preact/hooks';
import { SlotConfigType, SlotReward } from '../app';
import axios from 'axios';
import { CONFIG } from '../config/index..ts';

export const shouldBeTrue = (percentage: number): boolean => {
    const randomValue = Math.floor(Math.random() * (100 - 1 + 1) + 1);
    return randomValue < percentage;
};

function getRandomItem(items: any[]) {
    const maxIterations = 1000; // Set a reasonable maximum number of iterations

    let maxProbabilityItem = null;
    let maxProbability = -1;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        const randomizedItems = [...items].sort(() => Math.random() - 0.5);

        const totalProb = randomizedItems.reduce(
            (total, item) => total + item.adjusted_prob,
            0
        );
        const rand = Math.random() * totalProb;

        let cumulativeProb = 0;

        for (const item of randomizedItems) {
            cumulativeProb += item.adjusted_prob;

            if (rand < cumulativeProb) {
                return item;
            }
        }

        // If the loop completes without returning, update the maxProbabilityItem
        console.warn('Invalid probabilities detected. Restarting...');
        for (const item of randomizedItems) {
            if (item.adjusted_prob > maxProbability) {
                maxProbability = item.adjusted_prob;
                maxProbabilityItem = item;
            }
        }
    }

    // If the loop reaches the maximum number of iterations, log an error and return the item with the highest probability.
    console.error(
        'Exceeded maximum iterations. Something might be wrong with the probabilities.'
    );
    return maxProbabilityItem;
}

type ProbabilityItem = { base_probability: number } & SlotReward;
export const probabilityCalc = async (
    items: ProbabilityItem[],
    prizesIndexArr: number[],
): Promise<SlotReward> => {
    // Make sure we only use items that have qty
    const response = await axios.get(
        `${
            CONFIG.apiUrl
        }/api/awards?filters[qty][$gt]=0`
    );

    let filteredItems = response.data.data.map((item) => ({...item.attributes, id: item.id}))

    if (prizesIndexArr.length > 0) {
        filteredItems = filteredItems.filter(
            (i) => i.index !== prizesIndexArr[0]
        );
    }

    // Calculate total stock and total rarity
    const initialStock = filteredItems.reduce(
        (total, item) => total + item.stock,
        0
    );
    const totalStock = filteredItems.reduce(
        (total, item) => total + item.qty,
        0
    );
    const totalRarity = filteredItems.reduce(
        (total, item) => total + 1 / item.rarity_level,
        0
    );

    // Assign Base Probabilities based on Rarity
    filteredItems.forEach((item) => {
        item.base_probability = (item.qty * 100) / totalStock;
    });

    // Adjust Probabilities based on Stock Levels
    filteredItems.forEach((item) => {
        item.adjusted_prob =
            (item.base_probability / item.rarity_level / totalRarity / initialStock) *
            1000;
    });

    return getRandomItem(filteredItems);
};

export const configTheme = (
    theme: SlotConfigType['theme'],
    handler: StateUpdater<SlotConfigType>
) => {
    let reelImg = '',
        iconNum = 0,
        iconHeight = 0,
        iconWidth = 0,
        rotations = 0;

    console.log(theme);

    switch (theme) {
        case 'classic':
            reelImg = 'https://assets.codepen.io/439000/slotreel.webp';
            iconNum = 9;
            iconHeight = 79;
            iconWidth = 79;
            rotations = 1;
            break;
        case 'soccer':
            reelImg = '/img/soccer-grid.png';
            iconNum = 4;
            iconHeight = 80;
            iconWidth = 80;
            rotations = 5;
            break;
    }

    handler((prev) => ({
        ...prev,
        reelImg,
        icon_num: iconNum,
        icon_height: iconHeight,
        icon_width: iconWidth,
        theme,
        additional_rotations: rotations,
    }));
};

/** https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
function shuffle(array: any[]) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
}

export const arrayOfProbabilities = (length = 5, finalProb: number) => {
    const randomNumbers = Array.from(
        { length: length - 1 },
        () => Math.floor(Math.random() * finalProb) + 1
    );

    randomNumbers.push(finalProb);

    return shuffle(randomNumbers);
};
