import PlayBtn from '../../../assets/svg/play-btn.svg';
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
                <img onClick={handleClickPlay} src={PlayBtn} alt="btn" />
            ) : clickedPlay && typeof numberOfPlays !== 'number' ? (
                <>
                    <img
                        onClick={() => handleClickUserType(true)}
                        src={UserBacanaBtn}
                        alt="btn"
                    />

                    <img
                        onClick={() => handleClickUserType(false)}
                        src={NonUserBacanaBtn}
                        alt="btn"
                    />
                </>
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
    bottom: 25vh;

    img {
        width: 60%;
    }
`;
