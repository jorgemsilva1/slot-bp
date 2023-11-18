import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Slot } from './shared';
import { VariablesType } from './shared/slot/slot';
import axios from 'axios';
import { CONFIG } from './config/index.';
import { Config } from './components/config/config';

export type SlotConfigType = {
    win_percentage: number | 'auto';
    theme: 'soccer' | 'classic';
    reelImg: string;
    additional_rotations: number;
    number_of_reels: number;
    user_type: 'regular' | 'bacana';
    blocked: boolean;
    num_of_plays: number | null;
} & VariablesType;

export type SlotReward = {
    id: number;
    name: string;
    is_premium_prize: boolean;
    qty: number;
    stock: number;
    index: number;
    rarity: number;
    base_probability?: number;
    adjusted_prob?: number;
    icon: {
        filetype: string;
        height: number;
        width: number;
        url: string;
        fileUrl: string;
        filename: string;
    };
};

export function App() {
    const awardsRef = useRef();
    const [slotConfig, setSlotConfig] = useState<SlotConfigType>({
        win_percentage: 'auto',
        icon_width: 450 /** 5*/,
        icon_height: 450 /** 5*/,
        icon_num: 5,
        time_per_icon: 100,
        indexes: [0, 0, 0],
        theme: 'soccer',
        reelImg: '/img/reel.png',
        additional_rotations: 2,
        number_of_reels: 4,
        user_type: 'regular',
        blocked: true,
        num_of_plays: null,
    });

    const fetchInitialData = useCallback(async (isBacana?: boolean) => {
        const response = await axios.get(
            `${
                CONFIG.apiUrl
            }/api/configs?populate=awards.icon,theme&timestamp=${new Date().getTime()}`
        );
        let activeSlot = response.data.data.find(
            (el: any) => el.attributes.active
        );

        const theme = activeSlot.attributes.theme.data.attributes.theme_id;
        const winningChance =
            activeSlot.attributes[
                isBacana ? 'bacana_user_chance' : 'non_bacana_user_chance'
            ];
        const rewards = activeSlot.attributes.awards.data.map((award: any) => ({
            id: award.id,
            name: award.attributes.name,
            is_premium_prize: award.attributes.is_premium_prize,
            qty: award.attributes.qty,
            stock: award.attributes.stock,
            index: award.attributes.index,
            rarity: award.attributes.rarity_level,
            icon: {
                filetype:
                    award.attributes.icon.data.attributes.ext.split('.')[1],
                height: award.attributes.icon.data.attributes.height,
                width: award.attributes.icon.data.attributes.width,
                url: award.attributes.icon.data.attributes.url,
                fileUrl: `${CONFIG.apiUrl}${award.attributes.icon.data.attributes.url}`,
                filename: award.attributes.icon.data.attributes.hash,
            },
        }));

        activeSlot = {
            id: activeSlot.id,
            rewards,
            theme,
        };

        debugger;

        setSlotConfig((prevValue) => ({
            ...prevValue,
            // icon_num: rewards.length,
            win_percentage:
                isBacana === undefined
                    ? prevValue.win_percentage
                    : winningChance,
            num_of_plays: isBacana === undefined ? null : isBacana ? 10 : 5,
        }));
        awardsRef.current = activeSlot;
    }, []);

    console.log(slotConfig);

    const handleOnWin = async (wonIndex: number) => {
        const internalConfig = awardsRef.current;

        // Find the element with the winning index
        const element = internalConfig.rewards.find(
            (el) => el.index === wonIndex
        );

        try {
            // Remove one item from the stock
            await axios.put(`${CONFIG.apiUrl}/api/awards/${element.id}`, {
                data: {
                    qty: element?.qty - 1,
                },
            });

            // Add the play
            await axios.post(`${CONFIG.apiUrl}/api/plays`, {
                data: {
                    won: true,
                    won_premium: element?.is_premium_prize,
                    is_bacana: false,
                    prize_id: element.id,
                    config_id: internalConfig.id,
                },
            });
            await fetchInitialData();
        } catch (err) {
            console.log(err);
        }
    };

    const handleOnLose = async () => {
        const internalConfig = awardsRef.current;
        try {
            // If the player lost, just save the play as lost
            await axios.post(`${CONFIG.apiUrl}/api/plays`, {
                data: {
                    won: false,
                    won_premium: false,
                    is_bacana: false,
                    config_id: internalConfig.id,
                },
            });
            await fetchInitialData();
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    return (
        <>
            <Slot
                onWin={handleOnWin}
                onLose={handleOnLose}
                config={slotConfig}
                awards={awardsRef.current?.rewards}
                fetchInitialData={fetchInitialData}
            />
        </>
    );
}

/** <Config config={slotConfig} setConfig={setSlotConfig} /> **/
