import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import styled from 'styled-components';
import coin1 from '../../assets/coins/coin1.svg';
import coin2 from '../../assets/coins/coin2.svg';
import coin3 from '../../assets/coins/coin3.svg';
import coin4 from '../../assets/coins/coin4.svg';
import coin5 from '../../assets/coins/coin5.svg';
import coin6 from '../../assets/coins/coin1.png';
import coin7 from '../../assets/coins/coin2.png';
import ganhaste from '../../../public/img/ganhaste.svg';
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
import { Divider } from '../../components/config/partials/divider/divider.tsx';

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
    const gameOver = useRef(false);
    const probss = useRef([]);
    // const [awardss, setAwardss] = useState([]);

    const awardss = useRef([]);

    const [clickedPlay, setClickedPlay] = useState(false);
    const [numberOfPlays, setNumberOfPlays] = useState(null);
    const [waitingForScan, setWaitingForScan] = useState(false);
    const [scan, setScan] = useState('');
    const reelsRef = useRef([]);
    const [bg, setBg] = useState('one');
    const [rolling, setRolling] = useState(false);
    const [empty, setEmpty] = useState(false);
    const [showPrize, setShowPrize] = useState(false);

    const [probs, setProbs] = useState({
        user: 0,
        bacana: 0,
    });

    const prizes = useRef([]);
    const inputs = useRef({});
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
        gameOver.current = true;
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
        setRolling(true);
        disabled.current = true;
        // 1. If it is second play, add a 15% chance on every round
        // 2. If non-user, and has won already one prize, can only win on the 4/5th play
        const probability = probss.current[myArr.current.length];

        rollSoundRef.current.playSound();

        const item = await probabilityCalc(
            awardss.current,
            prizes.current,
            inputs.current.isBac
        );
        console.log(probss.current);
        console.log(awardss.current);
        console.log(item);

        const winningSymbolIndex = probability ? item?.index : null;

        const reelElements = reelsRef.current.filter((el) => Boolean(el));

        let perReelChosen: number[];
        if (winningSymbolIndex != null) {
            perReelChosen = reelElements.map(() => winningSymbolIndex);
        } else {
            perReelChosen = reelElements.map(
                () =>
                    Math.round(Math.random() * config.icon_num) %
                    config.icon_num
            );
            if (perReelChosen.every((i) => i === perReelChosen[0])) {
                perReelChosen[perReelChosen.length - 1] =
                    (perReelChosen[0] + 1) % config.icon_num;
            }
        }

        const deltas = await Promise.all(
            reelElements.map((reel, index) =>
                roll(reel, index, perReelChosen[index])
            )
        );

        myArr.current = [
            ...myArr.current,
            typeof winningSymbolIndex === 'number' ? item.name : null,
        ];

        // Check winning status and define rules
        if (probability === 100) {
            setShowPrize(true);

            onWin(item, inputs.current.isBac);
            winSoundRef.current.playSound();

            prizes.current = [...prizes.current, item.index];
            getAwards();
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
            onLose(inputs.current.isBac);
            lostSoundRef.current.playSound();
        }
        disabled.current = false;
        setNumberOfPlays((prevValue) =>
            typeof prevValue === 'number' ? prevValue - 1 : null
        );
        setRolling(false);
    }, [
        inputs.current.isBac,
        roll,
        onWin,
        dispatch,
        contextConfig.value.user_type,
        endGame,
        onLose,
    ]);

    const handleClickUserType = useCallback(
        async (bool: boolean) => {
            setBg('two');
            clickSoundRef.current.playSound();
            ambienceSoundRef.current.setVolume(0.02);
            setNumberOfPlays(5);
            if (bool) {
                await setWaitingForScan(true);
            } else {
                disabled.current = false;
                await fetchInitialData(false);
                inputs.current = {
                    isBac: false,
                    isDeposit: false,
                    isWon: false,
                };
                getAwards();
                getProbs();
            }
        },
        [fetchInitialData]
    );

    useEffect(() => {
        document.getElementById('qrcode')?.focus();
    }, [waitingForScan]);

    const handlePlay = useCallback(() => {
        setClickedPlay(true);
        ambienceSoundRef.current.setVolume(0.04);
        clickSoundRef.current.playSound();
    }, []);

    const handleRestart = useCallback(async () => {
        // Add the play
        await axios.post(`${CONFIG.apiUrl}/api/csv/append`, {
            data: {
                myArr: [
                    ...myArr.current,
                    ...Array(5 - myArr.current.length).fill(null),
                ].slice(0, 5),
                isBacana: contextConfig.value.user_type === 'bacana',
                isDeposit: inputs.current.isDeposit,
                hasWon: inputs.current.isWon,
            },
        });

        inputs.current = { isBac: false, isDeposit: false, isWon: false };
        setBg('one');
        setShowPrize(false);
        clickSoundRef.current.playSound();
        ambienceSoundRef.current.setVolume(0.2);
        await fetchInitialData();
        myArr.current = [];
        disabled.current = true;
        prizes.current = [];
        reelsRef.current = [];
        gameOver.current = false;
        setScan('');
        probss.current = [];
        setClickedPlay(false);
        setNumberOfPlays(null);
        setWaitingForScan(false);
    }, [fetchInitialData]);

    const isJson = (str: string) => {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    };

    const handleRollClick = useCallback(async () => {
        console.log(awardss.current);
        if (awardss.current?.length && !disabled.current && !gameOver.current) {
            handleReset();
            await handleRoll();
        }
    }, [handleReset, handleRoll]);

    const handleScan = useCallback(
        async (force = null) => {
            let qrcode = scan
                .replaceAll('Ç', ':')
                .replaceAll('ª', '"')
                .replace('`', '}')
                .replace('*', '{');
            if (qrcode[qrcode.length - 1] != '}') qrcode = qrcode + '}';
            if (isJson(qrcode)) {
                qrcode = JSON.parse(qrcode);
                inputs.current = {
                    isBac: true,
                    isDeposit: qrcode.deposit,
                    isWon: qrcode.won,
                };
                await fetchInitialData(true, qrcode.deposit, qrcode.won);
                disabled.current = false;
                setWaitingForScan(false);
                getAwards();
                getProbs();
                //handleRollClick()
            }
        },
        [scan]
    );

    useEffect(() => {
        window.document.addEventListener('keydown', async (event) => {
            if (
                event.key === '5' &&
                awardss.current.length &&
                !disabled.current
            ) {
                handleReset();
                disabled.current = true;
                await handleRoll();
            }
        });
    }, [gameOver.current, handleReset, handleRoll]);

    const handleBlur = () => {
        // delay focus call until after blur truly finishes
        setTimeout(() => {
            document.getElementById('qrcode')?.focus();
        }, 0);
    };

    const getProbs = useCallback(async () => {
        try {
            console.log('vain bsucsar probs');
            // Get slot probs
            const response = await axios.get(`${CONFIG.apiUrl}/api/configs`);

            const activeSlot = response.data.data.find(
                (el: any) => el.attributes.active
            );

            contextConfig.value.bacana_user_second_chance =
                activeSlot.attributes.bacana_user_second_chance;
            contextConfig.value.deposit_bacana_user_second_chance =
                activeSlot.attributes.deposit_bacana_user_second_chance;
            contextConfig.value.non_bacana_user_second_chance =
                activeSlot.attributes.non_bacana_user_second_chance;

            const finalProb = inputs.current.isBac
                ? inputs.current.isDeposit
                    ? activeSlot.attributes.deposit_bacana_user_chance
                    : activeSlot.attributes.bacana_user_chance
                : activeSlot.attributes.non_bacana_user_chance;
            const finalProbSecond = inputs.current.isBac
                ? inputs.current.isDeposit
                    ? activeSlot.attributes.deposit_bacana_user_second_chance
                    : activeSlot.attributes.bacana_user_second_chance
                : activeSlot.attributes.non_bacana_user_second_chance;

            const winRand = Math.random();
            const winSecondRand = Math.random();
            const wins = winRand < finalProb / 100;
            const winsSecond = winSecondRand < finalProbSecond / 100;

            const count = wins ? 1 + Number(winsSecond) : 0;

            const arr = shuffle(Array(5).fill(0).fill(100, 0, count));

            console.log('ORDEM PREMIOS', arr);

            probss.current = arr;
            inputs.current = {
                ...inputs.current,
                wins,
                winsSecond,
                winRand,
                winSecondRand,
            };
            return {
                user: activeSlot.attributes.non_bacana_user_chance,
                bacana: activeSlot.attributes.bacana_user_chance,
                deposit: activeSlot.attributes.deposit_bacana_user_chance,
            };
        } catch (err) {
            alert('Ocorreu um erro com as probs.');
        }
    }, [inputs.current]);

    function shuffle(arr: any[]) {
        const n = arr.length;
        const hundredIdx = arr
            .map((v, i) => (v === 100 ? i : -1))
            .filter((i) => i >= 0);
        const zeroIdx = arr
            .map((v, i) => (v === 0 ? i : -1))
            .filter((i) => i >= 0);

        // probability to pick a 100‐slot on the first swap:
        const k = hundredIdx.length; // 0,1, or 2
        const pPick100 = (0.5 * k) / (n - 0.5);

        let j;
        if (hundredIdx.length > 0 && Math.random() < pPick100) {
            // pick among the 100s
            j = hundredIdx[Math.floor(Math.random() * hundredIdx.length)];
        } else {
            // pick among the zeros
            j = zeroIdx[Math.floor(Math.random() * zeroIdx.length)];
        }

        // first swap fixes the "last" slot bias
        [arr[n - 1], arr[j]] = [arr[j], arr[n - 1]];

        // now finish a standard Fisher–Yates on positions 0..n-2
        for (let i = n - 2; i > 0; i--) {
            const k = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[k]] = [arr[k], arr[i]];
        }

        return arr;
    }

    const getAwards = useCallback(() => {
        console.log('ENTREI NO GET AWARDS');
        console.log(inputs);
        let finalAwards = null;
        const isAllZero = (arr) =>
            Array.isArray(arr) && arr.every((item) => item.qty === 0);

        if (inputs.current.isBac) {
            const force = awards.current.forceRewardsBacana;
            const forceDeposit = awards.current.forceRewardsBacanaDeposit;
            const bacana = awards.current.rewardsBacana;
            const bacanaDeposit = awards.current.rewardsBacanaDeposit;
            if (inputs.current.isDeposit) {
                if (
                    !inputs.current.isWon &&
                    !prizes.current.length &&
                    forceDeposit &&
                    !isAllZero(forceDeposit)
                ) {
                    finalAwards = forceDeposit;
                } else if (bacanaDeposit && !isAllZero(bacanaDeposit)) {
                    finalAwards = bacanaDeposit;
                } else {
                    finalAwards = [];
                }
            } else {
                if (
                    !inputs.current.isWon &&
                    !prizes.current.length &&
                    force &&
                    !isAllZero(force)
                ) {
                    finalAwards = force;
                } else if (bacana && !isAllZero(bacana)) {
                    finalAwards = bacana;
                } else {
                    finalAwards = [];
                }
            }
        } else {
            const normal = awards.current?.rewards;

            console.log('NORMAL', normal);
            finalAwards = normal && !isAllZero(normal) ? normal : [];
        }
        if (finalAwards.length === 0) setEmpty(true);
        console.log(finalAwards);
        awardss.current = finalAwards;
    }, [awards, inputs.current]);

    useEffect(() => {
        if (numberOfPlays === 0) {
            endGame();
        }
    }, [numberOfPlays, endGame]);

    return (
        <FullScreen handle={fsHandle}>
            {((disabled.current && !rolling) || showPrize) &&
                !gameOver.current && (
                    <div
                        style={{
                            zIndex: '1',
                            opacity: '90%',
                            top: '18vh',
                            borderRadius: '28px',
                            marginTop: '5px',
                            backgroundColor: '#000000',
                            width: '90%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            height: '37dvh',
                            paddingBottom: '8px',
                            position: 'absolute',
                        }}
                    ></div>
                )}
            <Container id={gameOver.current ? 'gameover-container' : ''}>
                <BgController backgroundId={bg as any} />
                {showPrize && (
                    <FallingCoins
                        coinSrcs={[
                            coin1,
                            coin2,
                            coin3,
                            coin4,
                            coin5,
                            coin6,
                            coin7,
                        ]}
                        coinCount={70}
                        duration={2}
                    ></FallingCoins>
                )}
                {!gameOver.current ? (
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

                            <WonPrize
                                className={showPrize ? '' : 'hide'}
                                style={{ position: 'absolute', zIndex: 9999 }}
                            >
                                <img src={ganhaste}></img>

                                <div
                                    style={{
                                        position: 'absolute',
                                        zIndex: 9999,
                                    }}
                                >
                                    <p
                                        className="title"
                                        style={{
                                            fontSize: '5rem',
                                            color: 'white',
                                            marginTop: '0rem',
                                        }}
                                    >
                                        Ganhaste
                                    </p>
                                    <p
                                        style={{
                                            fontSize: '8rem',
                                            color: 'white',
                                            marginTop: '-3rem',
                                            width: 'max-content',
                                            marginLeft: 'auto',
                                            marginRight: 'auto',
                                        }}
                                    >
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
            {waitingForScan && (
                <div
                    style={{
                        top: '37%',
                        width: '100%',
                        textAlign: 'center',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontWeight: 800,
                        fontFamily: 'Futura',
                        fontSize: '9rem',
                        zIndex: 9999,
                        color: '#fff',
                        padding: '5rem',
                        position: 'absolute',
                        textTransform: 'uppercase',
                    }}
                >
                    A aguardar leitura...
                    <input
                        id={'qrcode'}
                        value={scan}
                        onChange={(e) => {
                            setScan(e.target?.value);
                        }}
                        type="text"
                        autocomplete="off"
                        style={{
                            opacity: '0%',
                            left: 0,
                            position: 'absolute',
                            fontSize: '10rem',
                        }}
                        onBlur={handleBlur}
                        onKeyPress={(event) => {
                            if (event.key === 'Enter') {
                                handleScan();
                            }
                        }}
                    />
                </div>
            )}

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
            margin-top: 0vh;
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
