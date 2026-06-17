import PlayBtn from '../../../assets/svg/play-btn.png';
import BtnBg from '../../../assets/svg/btn_bg.svg';
import UserBacanaBtn from '../../../assets/svg/btn-user-bp.svg';
import NonUserBacanaBtn from '../../../assets/svg/btn-user-non-bp.svg';
import styled from 'styled-components';

export const BtnToggle = ({
    clickedPlay,
    numberOfPlays,
    handleClickPlay,
    handleClickUserType,
}: {
    clickedPlay: boolean;
    numberOfPlays: any;
    handleClickPlay: any;
    handleClickUserType: any;
}) => {
    return (
        <BtnWrapper>
            {!clickedPlay ? (
                <div
                    onClick={handleClickPlay}
                    style={{
                        width: '100%',
                        position: 'relative',
                        marginTop: '-10vh',
                        left: '30vw',
                    }}
                >
                    <img
                        src={BtnBg}
                        alt="btn"
                        style={{ position: 'absolute', zIndex: 2 }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            zIndex: 9,
                            color: 'white',
                            fontSize: '8rem',
                            left: '14%',
                            marginTop: '4%',
                            fontFamily: 'Futura',
                            fontWeight: 800,
                        }}
                    >
                        PLAY
                    </div>
                </div>
            ) : clickedPlay && typeof numberOfPlays !== 'number' ? (
                <div style={{ width: '100%' }}>
                    <div
                        onClick={() => handleClickUserType(true)}
                        style={{
                            width: '100%',
                            position: 'relative',
                            marginTop: '-10vh',
                            left: '30vw',
                        }}
                    >
                        <img
                            src={BtnBg}
                            alt="btn"
                            style={{ position: 'absolute', zIndex: 2 }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                textAlign: 'center',
                                zIndex: 9,
                                color: 'white',
                                marginLeft: '8%',
                                marginTop: '3%',
                                fontSize: '6rem',
                            }}
                        >
                            <div
                                style={{
                                    fontFamily: 'Futura',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                }}
                            >
                                Utilizador
                            </div>
                            <div
                                style={{
                                    fontFamily: 'FuturaBold',
                                    fontWeight: 600,
                                    marginTop: '-40px',
                                    fontSize: '5rem',
                                }}
                            >
                                BacanaPlay
                            </div>
                        </div>
                    </div>
                    <div
                        onClick={() => handleClickUserType(false)}
                        style={{
                            width: '100%',
                            position: 'relative',
                            marginTop: '11vh',
                            left: '30vw',
                        }}
                    >
                        <img
                            src={BtnBg}
                            alt="btn"
                            style={{ position: 'absolute', zIndex: 2 }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                textAlign: 'center',
                                zIndex: 9,
                                color: 'white',
                                marginLeft: '3%',
                                marginTop: '3%',
                                fontSize: '6rem',
                            }}
                        >
                            <div
                                style={{
                                    fontFamily: 'Futura',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                }}
                            >
                                Não Utilizador
                            </div>
                            <div
                                style={{
                                    fontFamily: 'FuturaBold',
                                    fontWeight: 600,
                                    marginTop: '-40px',
                                    fontSize: '5rem',
                                }}
                            >
                                BacanaPlay
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <></>
            )}
        </BtnWrapper>
    );
};

const BtnWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: 64px;
    position: absolute;
    width: 100%;
    height: 30px;
    bottom: 62.5vh;
    z-index: 2;

    img {
        width: 40%;
    }
`;
