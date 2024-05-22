import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import styled from 'styled-components';
import { SlotConfigType, SlotReward } from '../../app';
import {
    arrayOfProbabilities,
    checkIfUserCanPlay,
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
import PrizeDesktopBg from '../../assets/svg/prize_desktop.svg';
import { WinnerPrize } from './partials/WinnerPrize';
import axios from 'axios';
import { CONFIG } from '../../config/index.';

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
    const disabled = useRef(false);
    const [gameOver, setGameOver] = useState(false);
    const [clickedPlay, setClickedPlay] = useState(true);
    const [numberOfPlays, setNumberOfPlays] = useState(5);
    const reelsRef = useRef([]);
    const [bg, setBg] = useState('one');
    const [showPrize, setShowPrize] = useState(false);

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
        setShowPrize(false);
        reelsRef.current
            .filter((el) => Boolean(el))
            .map((reel: HTMLElement) => {
                reel.style.transition = `none`;
                reel.style.backgroundPositionY = `0`;
            });
    }, []);

    const endGame = useCallback(() => {
        disabled.current = true;
        // prizes.current = [];
        ambienceSoundRef.current.setVolume(0.2);
        // setBg('go');
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
                    config.icon_num - 1 + delta * config.time_per_icon * 25;
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
        const canPlay = await checkIfUserCanPlay(1);

        disabled.current = true;
        const probability = 100 || probArr.current[myArr.current.length];

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
                .map((reel, index) => roll(reel, index, winningSymbolIndex))
        );

        myArr.current = [
            ...myArr.current,
            winningSymbolIndex ? item.name : null,
        ];
        // console.table(myArr.current);

        // Check winning status and define rules
        if (deltas.every((value, _, arr) => arr[0] === value)) {
            // if (deltas[0] === deltas[2]) {
            // setShowPrize(true);

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
            if (prizes.current.length === 1) {
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
        contextConfig.value.win_percentage,
        contextConfig.value.user_type,
        awards,
        config.icon_num,
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
        // return;
        // setBg('one');
        // setShowPrize(false);
        clickSoundRef.current.playSound();
        ambienceSoundRef.current.setVolume(0.2);
        await fetchInitialData();
        myArr.current = [];
        disabled.current = false;
        prizes.current = [];
        reelsRef.current = [];
        setGameOver(false);
        // setClickedPlay(false);
        setNumberOfPlays(1);
    }, [fetchInitialData]);

    const handleRollClick = useCallback(async () => {
        if (awards?.length && !disabled.current) {
            handleReset();
            disabled.current = true;
            await handleRoll();
        }
    }, [awards?.length, handleReset, handleRoll]);

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
                <>
                    {/* WINNER PRIZE */}
                    <WinnerPrize gameOver={gameOver} prizes={prizes.current} />
                    {/* END WINNER PRIZE */}
                    <SlotMachine _variables={config}>
                        {Array.from(Array(config.number_of_reels).keys()).map(
                            (index) => (
                                <span
                                    key={index}
                                    data-id={`reel-${index}`}
                                    ref={(element) =>
                                        ((reelsRef.current as any)[index] =
                                            element)
                                    }
                                    className="reel"
                                ></span>
                            )
                        )}

                        {/* <WonPrize className={showPrize ? '' : 'hide'}>
                            <img src={PrizeDesktopBg} alt="" />
                            <span>
                                <p className="title">Ganhaste:</p>
                                <p>{myArr.current[myArr.current.length - 1]}</p>
                            </span>
                        </WonPrize> */}
                        <RollBtnWrapper
                            onClick={handleRollClick}
                        ></RollBtnWrapper>
                    </SlotMachine>

                    {/* <BtnToggle
                        clickedPlay={clickedPlay}
                        numberOfPlays={numberOfPlays}
                        handleClickUserType={handleClickUserType}
                        handleClickPlay={handlePlay}
                    /> */}
                </>
            </Container>
            {/* <Controls
                handleRestart={handleRestart}
                fsHandle={fsHandle}
                handleActivateSound={activateAmbienceSound}
                hasSound={hasSound}
            /> */}
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
    position: absolute;
    top: 0;
    display: flex;
    justify-content: space-between;
    width: ${({ _variables }) =>
        `${_variables.icon_width * (_variables.number_of_reels * 1.04)}px`};
    height: 606px;
    overflow: hidden;
    border-radius: 12px;

    .reel {
        position: relative;
        display: inline-block;
        width: ${({ _variables }) => `${_variables.icon_width}px`};
        height: ${({ _variables }) => `${_variables.icon_height * 16}px`};
        border-radius: 2px;
        background-image: ${({ _variables }) => `url(${_variables.reelImg})`};
        background-repeat: repeat-y;
        // background-position-y: -30px;

        /** TEMP **/
        background-size: cover;
    }
`;

const WonPrize = styled.section`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 300ms cubic-bezier(0.68, -0.6, 0.32, 1.6);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 890px;
    filter: drop-shadow(32px 34px 46px rgba(0, 0, 0, 0.3));
    text-wrap: wrap;
    text-align: center;
    pointer-events: none;
    opacity: 1;

    &.hide {
        opacity: 0;
        transform: translate(-50%, -50%) scale(2);
        transition: all 300ms ease-in-out;
    }

    img {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translate(-50%);
        height: 100%;
        z-index: 0;
    }

    p {
        position: relative;
        width: 700px;
        line-height: 160px;
        color: #fff;
        font-family: 'Futura';
        font-size: 180px;
        font-weight: bold;
        text-transform: uppercase;
        margin: 0;

        &.title {
            font-size: 124px;
            color: #e45525;
            margin-top: -60px;
        }
    }
`;

const RollBtnWrapper = styled.div`
    position: absolute;
    bottom: 40px;
    left: 0;
    width: 100%;
    height: 100%;
`;
