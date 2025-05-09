import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Slot } from './shared';
import { VariablesType } from './shared/slot/slot';
import axios from 'axios';
import { CONFIG } from './config/index.';
import {
    resetState,
    setInitialStateData,
    useConfigContext,
} from './config/configContext';
import { act } from 'test-utils';

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
    const [hasWon, setHasWon] = useState(false);
    const { config, dispatch } = useConfigContext();
    const [slotConfig] = useState<SlotConfigType>({
        icon_width: 450 /** 5*/,
        icon_height: 450 /** 5*/,
        icon_num: 7,
        time_per_icon: 35,
        indexes: [0, 0, 0],
        theme: 'soccer',
        reelImg: '/img/reel.png',
        additional_rotations: 1,
        number_of_reels: 4,
    });

    const wsRef = useRef<WebSocket | null>(null);
    const playFromWs = useRef<() => void>(() => {});

    useEffect(() => {
        wsRef.current = new WebSocket("ws://localhost:1337");

        wsRef.current.onopen = () => {
            console.log("WebSocket connected");
        };

        wsRef.current.onclose = () => {
            console.log("WebSocket disconnected");
        };

        wsRef.current.onerror = (err) => {
            console.error("WebSocket error", err);
        };

        wsRef.current.onmessage = (msg) => {
            if (playFromWs.current && !msg.data.includes('Welcome')) playFromWs.current();
        };

        return () => {
            wsRef.current?.close();
        };
    }, []);

    const fetchData = useCallback(async () => {
        const response = await axios.get(
            `${
                CONFIG.apiUrl
            }/api/configs?populate=awards.icon,theme,awards_bacana,awards_bacana_deposit,force_bacana_award,force_deposit_bacana_award&timestamp=${new Date().getTime()}`
        );

        let activeSlot = response.data.data.find(
            (el: any) => el.attributes.active
        );

        const theme = activeSlot.attributes.theme.data.attributes.theme_id;
        const mapAwards = (awardsData: any[]) =>
            awardsData.map((award: any) => ({
                id: award.id,
                name: award.attributes.name,
                is_premium_prize: award.attributes.is_premium_prize,
                qty: award.attributes.qty,
                stock: award.attributes.stock,
                index: award.attributes.index,
                rarity_level: award.attributes.rarity_level,
                multiplier: award.attributes.multiplier === 'Double' ? 0.5 : award.attributes.multiplier === 'Triple' ? 0.33 : 1,
            }));

        const rewards = mapAwards(activeSlot.attributes.awards.data);
        const rewardsBacana = mapAwards(activeSlot.attributes.awards_bacana.data);
        const rewardsBacanaDeposit = mapAwards(activeSlot.attributes.awards_bacana_deposit.data);
        const forceRewardsBacana = mapAwards(activeSlot.attributes.force_bacana_award.data);
        const forceRewardsBacanaDeposit = mapAwards(activeSlot.attributes.force_deposit_bacana_award.data);

        activeSlot = {
            id: activeSlot.id,
            rewards,
            rewardsBacana,
            rewardsBacanaDeposit,
            forceRewardsBacana,
            forceRewardsBacanaDeposit,
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
            setHasWon(false)
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
        async (element: number, isBacana: boolean) => {
            const internalConfig = awardsRef.current;

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

                    setHasWon(true)
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

    const award = useMemo(() => {
        let awards = null
        const isAllZero = (arr) => Array.isArray(arr) && arr.every(item => item.qty === 0);

        if (config.user_type === 'bacana') {
            const force = awardsRef.current?.forceRewardsBacana;
            const bacana = awardsRef.current?.rewardsBacana;

            if (!hasWon && force && !isAllZero(force)) {
                awards = force;
            } else if (bacana && !isAllZero(bacana)) {
                awards = bacana;
            } else {
                awards = [];
            }

        } else {

            const normal = awardsRef.current?.rewards;

            awards = (normal && !isAllZero(normal)) ? normal : [];
        }
        return awards
    }, [config.user_type, hasWon]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    return (
        <Slot
            onWin={handleOnWin}
            onLose={handleOnLose}
            config={slotConfig}
            awards={award}
            fetchInitialData={fetchInitialData}
            setPlayFromWs={(fn: () => void) => { playFromWs.current = fn; }}
        />
    );
}
