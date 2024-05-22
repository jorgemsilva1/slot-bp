import { FaVolumeUp, FaVolumeOff } from 'react-icons/fa';
import { BiFullscreen, BiExitFullscreen } from 'react-icons/bi';
import { FullScreenHandle } from 'react-full-screen';
import styled from 'styled-components';

export const Controls = ({
    handleRestart,
    handleActivateSound,
    fsHandle,
    hasSound = false,
}: {
    handleRestart: any;
    handleActivateSound: () => void;
    fsHandle: FullScreenHandle;
    hasSound: boolean;
}) => {
    return (
        <Container>
            {/* SOUND TOGGLE */}
            <AudioBtn onClick={handleActivateSound}>
                {hasSound ? <FaVolumeUp /> : <FaVolumeOff />}
            </AudioBtn>
            {/* RESTART BUTTON */}
            <AudioBtn width="auto" onClick={handleRestart}>
                <p>Restart</p>
            </AudioBtn>
            {/* FULLSCREEN TOGGLE */}
            <AudioBtn
                onClick={fsHandle.active ? fsHandle.exit : fsHandle.enter}
            >
                {!fsHandle.active ? <BiFullscreen /> : <BiExitFullscreen />}
            </AudioBtn>
        </Container>
    );
};

const Container = styled.section`
    display: flex;
    column-gap: 24px;
    position: absolute;
    bottom: calc(150px + 2vh);
    left: 50%;
    transform: translateX(-50%);
`;

const AudioBtn = styled.button`
    width: ${({ width }) => width || '32px'};
    height: 32px;
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
        font-size: 14px;
        margin: 0 12px;
    }

    svg {
        transform: scale(4);
    }
`;
