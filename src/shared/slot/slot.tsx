import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import { FaVolumeUp, FaVolumeOff } from 'react-icons/fa';
import styled from 'styled-components';
import { SlotConfigType, SlotReward } from '../../app';
import { probabilityCalc, shouldBeTrue } from '../../helpers/functions';
import { SoundManager } from '../../components/soundManager/soundManager';
import { BiFullscreen, BiExitFullscreen } from 'react-icons/bi';

// BTNS
import PlayBtn from '../../assets/svg/play-btn.svg';
import UserBacanaBtn from '../../assets/svg/btn-user-bp.svg';
import NonUserBacanaBtn from '../../assets/svg/btn-user-non-bp.svg';

type SlotProps = {
    onWin: (wonindex: number) => any;
    onLose: () => any;
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
    const fsHandle = useFullScreenHandle();
    const myArr = useRef([]);
    const disabled = useRef(true);
    const [gameOver, setGameOver] = useState(false);
    const [clickedPlay, setClickedPlay] = useState(false);
    const [numberOfPlays, setNumberOfPlays] = useState(null);
    const [showPrize, setShowPrize] = useState(false);
    const [prizes, setPrizes] = useState<string[]>(['CAIXA']);
    const reelsRef = useRef([]);
    const [bg, setBg] = useState('one');

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

    console.log(ambienceSoundRef.current);

    /** SOUNDS */

    const handleReset = useCallback(() => {
        reelsRef.current
            .filter((el) => Boolean(el))
            .map((reel: HTMLElement) => {
                reel.style.transition = `none`;
                reel.style.backgroundPositionY = `0px`;
            });
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

        rollSoundRef.current.playSound();

        const willAlwaysWin =
            config.win_percentage === 'auto'
                ? false
                : shouldBeTrue(config.win_percentage);

        // let winningSymbolIndex = willAlwaysWin
        //     ? Math.floor(Math.random() * config.icon_num)
        //     : null;
        const item = probabilityCalc(awards);

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
            setPrizes((prevValue) => [...prevValue, item.name]);
            onWin(deltas[0]);
            winSoundRef.current.playSound();
        } else {
            onLose();
            lostSoundRef.current.playSound();
        }

        disabled.current = false;
        setNumberOfPlays((prevValue) =>
            typeof prevValue === 'number' ? prevValue - 1 : null
        );
    }, [config.win_percentage, awards, roll, onWin, onLose]);

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

    const handleRestart = useCallback(async () => {
        setBg('one');
        clickSoundRef.current.playSound();
        ambienceSoundRef.current.setVolume(0.2);
        await fetchInitialData();
        myArr.current = [];
        disabled.current = [];
        reelsRef.current = [];
        setGameOver(false);
        setClickedPlay(false);
        setNumberOfPlays(null);
        setPrizes([]);
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
        if (config.num_of_plays) setNumberOfPlays(config.num_of_plays);
    }, [config.num_of_plays]);

    useEffect(() => {
        if (numberOfPlays === 0) {
            ambienceSoundRef.current.setVolume(0.2);
            setBg('go');
            setGameOver(true);
        }
    }, [numberOfPlays]);

    return (
        <FullScreen handle={fsHandle}>
            <Container id={gameOver ? 'gameover-container' : ''}>
                {bg === 'one' ? (
                    <Background bg="one" />
                ) : bg === 'two' ? (
                    <Background bg="two" />
                ) : (
                    <Background bg="go" />
                )}

                {!gameOver ? (
                    <>
                        {/* {!clickedPlay ? (
                        // <button
                            
                        // >
                        //     PLAY
                        // </button>
                        <></>
                    ) : clickedPlay && typeof numberOfPlays !== 'number' ? (
                        <div style={{ display: 'flex', columnGap: 8 }}>
                            <button onClick={() => handleClickUserType(true)}>
                                User Bacana
                            </button>
                            <button onClick={() => handleClickUserType(false)}>
                                Non-User Bacana
                            </button>
                        </div>
                    ) : (
                        // <p>Jogada: {numberOfPlays}</p>
                        <></>
                    )} */}
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
                            {showPrize ? (
                                <PrizeIde>{prizes[prizes.length - 1]}</PrizeIde>
                            ) : (
                                <></>
                            )}
                        </SlotMachine>
                        {/* {prizes?.length > 0 ? (
                        // <p>Last Prize: {}</p>
                        <></>
                    ) : (
                        <></>
                    )} */}

                        {/* COLOCA O BOTÃO SVG */}
                        <BtnWrapper>
                            {!clickedPlay ? (
                                <img
                                    onClick={() => {
                                        setClickedPlay(true);
                                        ambienceSoundRef.current.setVolume(
                                            0.04
                                        );
                                        clickSoundRef.current.playSound();
                                    }}
                                    src={PlayBtn}
                                    alt="btn"
                                />
                            ) : clickedPlay &&
                              typeof numberOfPlays !== 'number' ? (
                                <>
                                    <img
                                        onClick={() =>
                                            handleClickUserType(true)
                                        }
                                        src={UserBacanaBtn}
                                        alt="btn"
                                    />

                                    <img
                                        onClick={() =>
                                            handleClickUserType(false)
                                        }
                                        src={NonUserBacanaBtn}
                                        alt="btn"
                                    />
                                </>
                            ) : (
                                <></>
                            )}
                        </BtnWrapper>
                    </>
                ) : (
                    <ul id="prizes">
                        {myArr.current.map((item, index) => (
                            <li key={index} className={item ? 'prize' : ''}>
                                {index + 1}. {item ? item : 'Sem prémio'}
                            </li>
                        ))}
                    </ul>
                )}
            </Container>
            <div
                style={{
                    position: 'absolute',
                    bottom: 150,
                    left: '50%',
                    transform: `translateX(-50%)`,
                    display: 'flex',
                    columnGap: 24,
                }}
            >
                <AudioBtn onClick={activateAmbienceSound}>
                    {hasSound ? <FaVolumeUp /> : <FaVolumeOff />}
                </AudioBtn>
                <AudioBtn width="auto" onClick={handleRestart}>
                    <p>Restart</p>
                </AudioBtn>
                <AudioBtn
                    onClick={fsHandle.active ? fsHandle.exit : fsHandle.enter}
                >
                    {!fsHandle.active ? <BiFullscreen /> : <BiExitFullscreen />}
                </AudioBtn>
            </div>
            <SoundManager
                ref={ambienceSoundRef}
                src="audio/ambience.wav"
                loop
                volume={0.2}
                playing
            />
            <SoundManager
                ref={clickSoundRef}
                src="audio/click.wav"
                volume={0.1}
                playing
            />
            <SoundManager
                ref={rollSoundRef}
                src="audio/rollete.wav"
                volume={0.1}
                playing
            />
            <SoundManager
                ref={winSoundRef}
                src="audio/win.wav"
                volume={0.1}
                playing
            />
            <SoundManager
                ref={lostSoundRef}
                src="audio/lost.wav"
                volume={0.1}
                playing
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

    #prizes {
        z-index: 9;
    }

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
/*background-color: #242424;*/

const SlotMachine = styled.section<{ _variables: SlotConfigType }>`
    position: relative;
    display: flex;
    justify-content: space-between;
    width: ${({ _variables }) =>
        `${_variables.icon_width * (_variables.number_of_reels * 1.04)}px`};
    height: ${({ _variables }) => `${_variables.icon_height * 3}px`};
    padding: ${({ _variables }) => `${_variables.icon_height * 0.05}px`};
    margin-bottom: 20dvh;

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

const AudioBtn = styled.button`
    width: ${({ width }) => width || '100px'};
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-transform: uppercase;
    font-weight: bold;
    background: white;
    color: black;
    border-radius: 0;
    border: 4px solid black;

    p {
        font-size: 48px;
        margin: 0 12px;
    }

    svg {
        transform: scale(4);
    }
`;

const BtnWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: 64px;
    position: absolute;
    width: 100%;
    height: 30px;
    bottom: 22vh;

    img {
        width: 40%;
    }
`;

const Background = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${({ bg }) => `url('/img/bg_${bg}.png')`};
    background-position: 0 3vh;
`;

const PrizeIde = styled.section`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #e45525;
    border: 10px solid black;
    font-size: 80px;
    font-weight: bold;
    padding: 48px;
`;
