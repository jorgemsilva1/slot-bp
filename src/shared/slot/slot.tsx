import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import styled from 'styled-components';
import coin1 from '../../assets/coins/coin1.svg';
import coin2 from '../../assets/coins/coin2.svg';
import coin3 from '../../assets/coins/coin3.svg';
import coin4 from '../../assets/coins/coin4.svg';
import coin5 from '../../assets/coins/coin5.svg';
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
import PrizeDesktopBg from '../../assets/svg/prize_desktop.svg';
import axios from 'axios';
import { CONFIG } from '../../config/index.';
import BlinkingBorderLights from '../../components/BlinkingBorderLights.tsx';
import FallingCoins from '../../components/FallingCoins.tsx';

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
    const [waitingForScan, setWaitingForScan] = useState(false);
    const [scan, setScan] = useState('');
    const reelsRef = useRef([]);
    const [bg, setBg] = useState('one');
    const [showPrize, setShowPrize] = useState(false);

    const [probs, setProbs] = useState({
        user: 0,
        bacana: 0,
    });

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
                    (offset + (config.icon_num) * config.additional_rotations) *
                        (config.icon_num) +
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
        const hasOnePrizeWon = prizes.current.length === 1;
        const isBacana = contextConfig.value.user_type === 'bacana';

        // 1. If it is second play, add a 15% chance on every round
        // 2. If non-user, and has won already one prize, can only win on the 4/5th play
        let probability;
        if (hasOnePrizeWon) {
            if (isBacana) {
                probability = myArr.current.length <= 1 ? 0 : contextConfig.value.bacana_user_second_chance;
            } else {
                probability = myArr.current.length <= 3 ? 0 : contextConfig.value.non_bacana_user_second_chance;
            }
        } else {
            probability = probArr.current[myArr.current.length];
        }

        rollSoundRef.current.playSound();

        const willAlwaysWin =
            contextConfig.value.win_percentage === 'auto'
                ? false
                : shouldBeTrue(probability);

        const item = await probabilityCalc(awards, prizes.current);

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
            typeof winningSymbolIndex === 'number' ? item.name : null,
        ];
        // console.table(myArr.current);

        // Check winning status and define rules
        if (deltas.every((value, _, arr) => arr[0] === value)) {
            setShowPrize(true);

            onWin(item, isBacana);
            winSoundRef.current.playSound();

            prizes.current = [...prizes.current, item.index];

            if (prizes.current.length === 1) {
                // If first prize, add to the array and change probability to a quarter
                dispatch(
                    setWinPercentage(
                        contextConfig.value.user_type === 'bacana' ? 20 : 15
                    )
                );
            } else if (prizes.current.length === 2) {
                // If is second prize, finish the game
                endGame();
            }
        } else {
            onLose(isBacana);
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
            if(bool) {
                setWaitingForScan(true);
            }
            else
                disabled.current = false;
        },
        [fetchInitialData]
    );

    useEffect(() => {
        document.getElementById('qrcode')?.focus()
    }, [waitingForScan])

    const handlePlay = useCallback(() => {
        console.log('[Slot] handlePlay called');
        setClickedPlay(true);
        ambienceSoundRef.current.setVolume(0.04);
        clickSoundRef.current.playSound();
    }, []);

    const handleRestart = useCallback(async () => {
        setBg('one');
        setShowPrize(false);
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
        setWaitingForScan(false)
    }, [fetchInitialData]);

    const handleRollClick = useCallback(async () => {
        if (awards?.length && !disabled.current) {
            handleReset();
            disabled.current = true;
            await handleRoll();
        }
    }, [awards?.length, handleReset, handleRoll]);

    const handleScan = useCallback(() => {
        console.log('called');
        disabled.current = false;
        setWaitingForScan(false)
    }, [])

    useEffect(() => {
        window.document.addEventListener('keydown', async (event) => {
            if (event.key === '5' && awards?.length && !disabled.current) {
                handleReset();
                disabled.current = true;
                await handleRoll();
            }
        });
    }, [awards?.length, gameOver, handleReset, handleRoll]);

    const handleBlur = () => {
        // delay focus call until after blur truly finishes
        setTimeout(() => {
            document.getElementById('qrcode')?.focus();
        }, 0);
    };

    const getProbs = useCallback(async () => {
        try {
            // Get slot probs
            const response = await axios.get(
                `${CONFIG.apiUrl}/api/configs?fields[0]=bacana_user_chance&fields[1]=non_bacana_user_chance&fields[2]=bacana_user_second_chance&fields[3]=non_bacana_user_second_chance&fields[4]=active`
            );

            const activeSlot = response.data.data.find(
                (el: any) => el.attributes.active
            );

            contextConfig.value.bacana_user_second_chance =activeSlot.attributes.bacana_user_second_chance
            contextConfig.value.non_bacana_user_second_chance =activeSlot.attributes.non_bacana_user_second_chance

            probArr.current = arrayOfProbabilities(
                contextConfig.value.num_of_plays,
                contextConfig.value.user_type === 'regular'
                    ? activeSlot.attributes.non_bacana_user_chance
                    : activeSlot.attributes.bacana_user_chance
            );

            return {
                user: activeSlot.attributes.non_bacana_user_chance,
                bacana: activeSlot.attributes.bacana_user_chance,
            };
        } catch (err) {
            alert('Ocorreu um erro com as probs.');
        }
    }, [contextConfig.value.num_of_plays]);

    useEffect(() => {
        if (contextConfig.value.num_of_plays) {
            setNumberOfPlays(contextConfig.value.num_of_plays);
            getProbs();
        }
    }, [contextConfig.value.num_of_plays, getProbs]);

    useEffect(() => {
        if (numberOfPlays === 0) {
            endGame();
        }
    }, [numberOfPlays, endGame]);

    return (
        <FullScreen handle={fsHandle}>

            {((disabled.current || showPrize) && !gameOver)  && <div style={{
                zIndex: '1',
                opacity: '90%',
                top: '18vh',
                marginTop: '5px',
                backgroundColor: '#232323',
                width: '90%',
                left: '50%',
                transform: 'translateX(-50%)',
                height: '37dvh',
                paddingBottom: '8px',
                position: 'absolute',
            }}></div>}
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


                            {showPrize && <FallingCoins coinSrcs={[coin1, coin2, coin3, coin4, coin5]} coinCount={70}
                                              duration={2}></FallingCoins>}
                            <WonPrize className={showPrize ? '' : 'hide'} style={{position: 'absolute', zIndex: 9999}}>
                                <BlinkingBorderLights style={{position: 'absolute'}}></BlinkingBorderLights>
                                <div style={{position: 'absolute', zIndex: 9999}}>
                                    <p className="title" style={{ fontSize: '4rem', color: 'white', marginTop: '0rem' }}>Ganhaste</p>
                                    <p style={{ fontSize: '6rem', color: '#232323', marginTop: '-4rem' }}>
                                        {
                                            myArr.current[
                                            myArr.current.length - 1
                                                ]
                                        }
                                    </p>
                                </div>
                            </WonPrize>
                        </SlotMachine>
                        <RollBtnWrapper
                            onClick={handleRollClick}
                        ></RollBtnWrapper>

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
            {waitingForScan && <div style={{top:'37%', width: '100%', textAlign: 'center', left:'50%', transform: 'translate(-50%, -50%)', fontWeight: 800, fontFamily: "Futura", fontSize: '9rem',zIndex: 9999, color: '#fff', padding: '5rem', position: 'absolute', textTransform: 'uppercase' }}>
                Waiting for scan...
                <input id={'qrcode'} value={scan} onChange={(e) => {
                    setScan(e.target?.value)
                }} type="text" style={{opacity: '0%', left: 0 , position:'absolute', fontSize: '10rem'}} onBlur={handleBlur} onKeyPress={event => {
                    if (event.key === 'Enter') {
                        handleScan()
                    }
                }}/>
            </div>}

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
            color: #fff;
            text-transform: uppercase;
        }

        ul {
            margin-top: 8vh;
            list-style: none;
            li {
                text-align: center;
                font-family: 'Futura';
                font-weight: bold;
                font-size: 10rem;

                &.prize {
                    font-size: 12rem;
                    color: #232323;
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
    bottom: 380px;
    left: 0;
    width: 100%;
    height: 1230px;
`;