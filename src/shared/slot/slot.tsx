import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import styled from 'styled-components';
import { SlotConfigType, SlotReward } from '../../app';
import {
    arrayOfProbabilities,
    probabilityCalc,
    shouldBeTrue,
} from '../../helpers/functions';

// BTNS
import { setWinPercentage, useConfigContext } from '../../config/configContext';
import { BgController } from './partials/BgController';
import { PrizeList } from './partials/PrizeList';
import { Controls } from './partials/Controls';
import { SoundStudio } from './partials/SoundStudio';
import { BtnToggle } from './partials/BtnToggle';

type SlotProps = {
    onWin: (wonindex: number, isBacana: boolean) => any;
    onLose: (isBacana: boolean) => any;
    fetchInitialData: any;
    awards: SlotReward[];
    config: SlotConfigType;
};

export type VariablesType = {
    icon_width: number;
    icon_height: number;
    icon_num: number;
    time_per_icon: number;
    indexes: [number, number, number];
};
export const Slot = ({
    config,
    onWin,
    awards,
    onLose,
    fetchInitialData,
}: SlotProps) => {
    const { config: _contextConfig, dispatch } = useConfigContext();
    const contextConfig = useRef({}).current;
    contextConfig.value = _contextConfig;
    const fsHandle = useFullScreenHandle();
    const myArr = useRef([]);
    const disabled = useRef(true);
    const [gameOver, setGameOver] = useState(false);
    const [clickedPlay, setClickedPlay] = useState(false);
    const [numberOfPlays, setNumberOfPlays] = useState(null);
    const reelsRef = useRef([]);
    const [bg, setBg] = useState('one');

    const prizes = useRef([]);
    const probArr = useRef([]);

    // SOUNDS REF
    const [hasSound, setHasSound] = useState(false);
    const ambienceSoundRef = useRef(null);
    const clickSoundRef = useRef();
    const rollSoundRef = useRef();
    const winSoundRef = useRef();
    const lostSoundRef = useRef();

    const activateAmbienceSound = () => {
        if (ambienceSoundRef.current) {
            if (hasSound) {
                ambienceSoundRef.current.toggleSound();
                setHasSound((prevValue) => !prevValue);
            } else {
                setHasSound(true);

                ambienceSoundRef.current.playSound();
            }
        }
    };

    const handleReset = useCallback(() => {
        reelsRef.current
            .filter((el) => Boolean(el))
            .map((reel: HTMLElement) => {
                reel.style.transition = `none`;
                reel.style.backgroundPositionY = `0px`;
            });
    }, []);

    const endGame = useCallback(() => {
        disabled.current = true;
        prizes.current = [];
        ambienceSoundRef.current.setVolume(0.2);
        setBg('go');
        setGameOver(true);
    }, []);

    /**
     * This functions controls the roll of the reels
     */
    const roll = useCallback(
        (reel: HTMLElement, offset = 0, chosen: number | null) => {
            // number of fruits animating
            let delta =
                (offset + config.icon_num * config.additional_rotations) *
                    config.icon_num +
                Math.round(Math.random() * config.icon_num);
            if (typeof chosen === 'number')
                delta =
                    (offset + config.icon_num * config.additional_rotations) *
                        config.icon_num +
                    chosen;

            const style = window.getComputedStyle(reel),
                backgroundPositionY = parseFloat(style['backgroundPositionY']),
                targetBackgroundPosition =
                    backgroundPositionY + delta * config.icon_height;

            return new Promise((resolve) => {
                const animationTime =
                    config.icon_num - 1 + delta * config.time_per_icon;
                reel.style.transition = `background-position-y ${animationTime}ms`;
                reel.style.backgroundPositionY = `${targetBackgroundPosition}px`;

                setTimeout(() => {
                    resolve(delta % config.icon_num); // returns the index of the item we got
                }, animationTime);
            });
        },
        [config]
    );

    const handleRoll = useCallback(async () => {
        disabled.current = true;
        const probability = probArr.current[myArr.current.length];

        rollSoundRef.current.playSound();

        const willAlwaysWin =
            contextConfig.value.win_percentage === 'auto'
                ? false
                : shouldBeTrue(probability);

        // let winningSymbolIndex = willAlwaysWin
        //     ? Math.floor(Math.random() * config.icon_num)
        //     : null;
        const item = probabilityCalc(awards, prizes.current);

        const winningSymbolIndex = willAlwaysWin ? item.index : null;

        const deltas = await Promise.all(
            reelsRef.current
                .filter((el) => Boolean(el))
                .map((reel, index) => {
                    return roll(reel, index, winningSymbolIndex);
                })
        );

        myArr.current = [
            ...myArr.current,
            winningSymbolIndex ? item.name : null,
        ];
        // console.table(myArr.current);

        // Check winning status and define rules
        if (deltas.every((value, _, arr) => arr[0] === value)) {
            onWin(deltas[0], contextConfig.value.user_type === 'bacana');
            winSoundRef.current.playSound();

            prizes.current = [...prizes.current, item.index];

            // if (prizes.current.length === 1) {
            //     // If first prize, add to the array and change probability to a quarter
            //     dispatch(
            //         setWinPercentage(
            //             contextConfig.value.user_type === 'bacana' ? 20 : 15
            //         )
            //     );
            // } else
            if (prizes.current.length === 2) {
                // If is second prize, finish the game
                endGame();
            }
        } else {
            onLose(contextConfig.value.user_type === 'bacana');
            lostSoundRef.current.playSound();
        }

        disabled.current = false;
        setNumberOfPlays((prevValue) =>
            typeof prevValue === 'number' ? prevValue - 1 : null
        );
    }, [
        contextConfig.value.user_type,
        contextConfig.value.win_percentage,
        awards,
        roll,
        onWin,
        endGame,
        onLose,
    ]);

    const handleClickUserType = useCallback(
        async (bool: boolean) => {
            setBg('two');
            clickSoundRef.current.playSound();
            ambienceSoundRef.current.setVolume(0.02);
            await fetchInitialData(bool);
            disabled.current = false;
        },
        [fetchInitialData]
    );

    const handlePlay = useCallback(() => {
        setClickedPlay(true);
        ambienceSoundRef.current.setVolume(0.04);
        clickSoundRef.current.playSound();
    }, []);

    const handleRestart = useCallback(async () => {
        setBg('one');
        clickSoundRef.current.playSound();
        ambienceSoundRef.current.setVolume(0.2);
        await fetchInitialData();
        myArr.current = [];
        disabled.current = [];
        prizes.current = [];
        reelsRef.current = [];
        setGameOver(false);
        setClickedPlay(false);
        setNumberOfPlays(null);
    }, [fetchInitialData]);

    useEffect(() => {
        window.document.addEventListener('keydown', async (event) => {
            if (event.key === '5' && awards?.length && !disabled.current) {
                handleReset();
                disabled.current = true;
                await handleRoll();
            }
        });
    }, [awards?.length, gameOver, handleReset, handleRoll]);

    useEffect(() => {
        if (contextConfig.value.num_of_plays) {
            setNumberOfPlays(contextConfig.value.num_of_plays);
            probArr.current = arrayOfProbabilities(
                contextConfig.value.num_of_plays
            );
        }
    }, [contextConfig.value.num_of_plays]);

    useEffect(() => {
        if (numberOfPlays === 0) {
            endGame();
        }
    }, [numberOfPlays, endGame]);

    return (
        <FullScreen handle={fsHandle}>
            <Container id={gameOver ? 'gameover-container' : ''}>
                <BgController backgroundId={bg as any} />
                {!gameOver ? (
                    <>
                        <SlotMachine _variables={config}>
                            {Array.from(
                                Array(config.number_of_reels).keys()
                            ).map((index) => (
                                <span
                                    key={index}
                                    ref={(element) =>
                                        ((reelsRef.current as any)[index] =
                                            element)
                                    }
                                    className="reel"
                                ></span>
                            ))}
                            {/* <WonPrize>
                                <p>Martelo Thor</p>
                            </WonPrize> */}
                        </SlotMachine>
                        <BtnToggle
                            clickedPlay={clickedPlay}
                            numberOfPlays={numberOfPlays}
                            handleClickUserType={handleClickUserType}
                            handleClickPlay={handlePlay}
                        />
                    </>
                ) : (
                    <PrizeList arr={myArr.current} />
                )}
            </Container>
            <Controls
                handleRestart={handleRestart}
                fsHandle={fsHandle}
                handleActivateSound={activateAmbienceSound}
                hasSound={hasSound}
            />
            <SoundStudio
                refs={{
                    ambience: ambienceSoundRef,
                    click: clickSoundRef,
                    roll: rollSoundRef,
                    win: winSoundRef,
                    lost: lostSoundRef,
                }}
            />
        </FullScreen>
    );
};

const Container = styled.main`
    position: relative;
    width: 100dvw;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    row-gap: 12px;

    &#gameover-container {
        * {
            color: #000;
            text-transform: uppercase;
        }

        ul {
            margin-top: 15vh;
            list-style: none;
            li {
                text-align: center;
                font-family: 'Futura';
                font-weight: bold;
                font-size: 64px;

                &.prize {
                    font-size: 84px;
                    color: #e45525;
                }
            }
        }
    }
`;

const SlotMachine = styled.section<{ _variables: SlotConfigType }>`
    position: relative;
    display: flex;
    justify-content: space-between;
    width: ${({ _variables }) =>
        `${_variables.icon_width * (_variables.number_of_reels * 1.04)}px`};
    height: ${({ _variables }) => `${_variables.icon_height * 3}px`};
    padding: ${({ _variables }) => `${_variables.icon_height * 0.05}px`};
    margin-bottom: 26dvh;

    .reel {
        position: relative;
        display: inline-block;
        width: ${({ _variables }) => `${_variables.icon_width}px`};
        height: ${({ _variables }) => `${_variables.icon_height * 3}px`};
        border-radius: 2px;
        background-image: ${({ _variables }) => `url(${_variables.reelImg})`};
        background-repeat: repeat-y;
        background-position-y: 0;

        /** TEMP **/
        background-size: cover;
    }
`;

const WonPrize = styled.section`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #e45525;
    border: 20px solid #000;
    max-width: 60%;
    text-wrap: wrap;
    text-align: center;

    p {
        color: #ffffff;
        font-family: 'Futura';
        font-size: 124px;
        font-weight: bold;
        text-transform: uppercase;
        -webkit-text-stroke: 5px black;
    }
`;
