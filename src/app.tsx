import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Slot } from './shared';
import { VariablesType } from './shared/slot/slot';
import axios from 'axios';
import { CONFIG } from './config/index.';
import {
    resetState,
    setInitialStateData,
    useConfigContext,
} from './config/configContext';

export type SlotConfigType = {
    theme: 'soccer' | 'classic';
    reelImg: string;
    additional_rotations: number;
    number_of_reels: number;
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
};

export function App() {
    const awardsRef = useRef();
    const { config, dispatch } = useConfigContext();
    const [slotConfig] = useState<SlotConfigType>({
        icon_width: 450 /** 5*/,
        icon_height: 450 /** 5*/,
        icon_num: 6,
        time_per_icon: 80,
        indexes: [0, 0, 0],
        theme: 'soccer',
        reelImg: '/img/reel.png',
        additional_rotations: 2,
        number_of_reels: 4,
    });

    const fetchData = useCallback(async () => {
        const response = await axios.get(
            `${
                CONFIG.apiUrl
            }/api/configs?populate=awards.icon,theme&timestamp=${new Date().getTime()}`
        );
        let activeSlot = response.data.data.find(
            (el: any) => el.attributes.active
        );

        const theme = activeSlot.attributes.theme.data.attributes.theme_id;
        const rewards = activeSlot.attributes.awards.data.map((award: any) => ({
            id: award.id,
            name: award.attributes.name,
            is_premium_prize: award.attributes.is_premium_prize,
            qty: award.attributes.qty,
            stock: award.attributes.stock,
            index: award.attributes.index,
            rarity: award.attributes.rarity_level,
        }));

        activeSlot = {
            id: activeSlot.id,
            rewards,
            theme,
            probs: {
                bacana: activeSlot.attributes.bacana_user_chance,
                user: activeSlot.attributes.non_bacana_user_chance,
            },
        };
        awardsRef.current = activeSlot;
        return activeSlot;
    }, []);

    const fetchInitialData = useCallback(
        async (isBacana?: boolean) => {
            if (config.user_type) {
                dispatch(resetState());
            }

            const res = await fetchData();
            const userType =
                config.user_type || isBacana === undefined
                    ? undefined
                    : isBacana
                    ? 'bacana'
                    : 'regular';
            const numOfPlays =
                (config.user_type || isBacana) === undefined
                    ? null
                    : config.user_type === 'bacana' || isBacana
                    ? 5
                    : 5;

            if (!config.user_type && !config.num_of_plays)
                dispatch(setInitialStateData(userType, numOfPlays, 100));
        },
        [config.num_of_plays, config.user_type, dispatch, fetchData]
    );

    const handleOnWin = useCallback(
        async (wonIndex: number, isBacana: boolean) => {
            const internalConfig = awardsRef.current;

            // Find the element with the winning index
            const element = internalConfig.rewards.find(
                (el) => el.index === wonIndex
            );

            try {
                if (element && element.id) {
                    // Remove one item from the stock
                    await axios.put(
                        `${CONFIG.apiUrl}/api/awards/${element.id}`,
                        {
                            data: {
                                qty: element?.qty - 1,
                            },
                        }
                    );

                    // Add the play
                    await axios.post(`${CONFIG.apiUrl}/api/plays`, {
                        data: {
                            won: true,
                            won_premium: element?.is_premium_prize,
                            is_bacana: isBacana,
                            prize_id: element.id,
                            config_id: internalConfig.id,
                        },
                    });
                }
                await fetchData();
            } catch (err) {
                console.log(err);
            }
        },
        [fetchData]
    );

    const handleOnLose = useCallback(
        async (isBacana: boolean) => {
            const internalConfig = awardsRef.current;
            try {
                // If the player lost, just save the play as lost
                await axios.post(`${CONFIG.apiUrl}/api/plays`, {
                    data: {
                        won: false,
                        won_premium: false,
                        is_bacana: isBacana,
                        config_id: internalConfig.id,
                    },
                });
                await fetchData();
            } catch (err) {
                console.log(err);
            }
        },
        [fetchData]
    );

    useEffect(() => {
        fetchInitialData();
    }, []);

    return (
        <Slot
            onWin={handleOnWin}
            onLose={handleOnLose}
            config={slotConfig}
            awards={awardsRef.current?.rewards}
            fetchInitialData={fetchInitialData}
        />
    );
}
