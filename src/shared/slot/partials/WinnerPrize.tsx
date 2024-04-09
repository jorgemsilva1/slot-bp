import styled from 'styled-components';
import VSIcon from '../../../assets/svg/vs-icon.svg';

import Icon0 from '../../../assets/svg/icon-0.svg';
import Icon1 from '../../../assets/svg/icon-1.svg';
import Icon2 from '../../../assets/svg/icon-2.svg';
import Icon3 from '../../../assets/svg/icon-3.svg';

import Artist0 from '../../../assets/svg/icon-adamastor-0.svg';
import Artist1 from '../../../assets/svg/icon-adamastor-1.svg';
import Artist2 from '../../../assets/svg/icon-adamastor-2.svg';
import Artist3 from '../../../assets/svg/icon-adamastor-3.svg';

export const WinnerPrize = ({
    gameOver = false,
    prizes = [],
}: {
    gameOver: boolean;
    prizes: number[];
}) => {
    const icons = [Icon0, Icon1, Icon2, Icon3];
    const artists = [Artist0, Artist1, Artist2, Artist3];

    return (
        <Container gameOver={gameOver}>
            <img src={artists[prizes[0] || 0]} className="icon icon-artist" />
            <img src={icons[prizes[0] || 0]} className="icon icon-avatar" />
            <img src={VSIcon} className="icon icon-vs" />
        </Container>
    );
};

const Container = styled.section<{ gameOver: boolean }>`
    position: absolute;
    top: 720px;
    right: 50%;
    transform: ${({ gameOver }) =>
        `scale(${gameOver ? 1 : 0}) translateX(50%)`};
    transform-origin: right;
    transition: ${({ gameOver }) =>
        `transform ${gameOver ? '50ms' : '0'} cubic-bezier(0.65, 0, 0.35, 1) ${
            gameOver ? '200ms' : '0ms'
        }`};
    width: 1880px;
    height: 1380px;
    background: #232323;
    z-index: 9;
    overflow: hidden;

    .icon {
        position: absolute;
        width: 67%;

        &-vs {
            width: 12.5%;
            left: 50%;
            top: 50%;
            transform: ${({ gameOver }) =>
                gameOver
                    ? 'translate(-50%, -50%)'
                    : 'translate(calc(-50% + -300px), calc(-50% + 60px))'};
            opacity: ${({ gameOver }) => (gameOver ? 1 : 0)};
            transition: ${({ gameOver }) =>
                `all ${
                    gameOver ? '200ms' : '0ms'
                } cubic-bezier(0.65, 0, 0.35, 1) 800ms`};
        }

        &-artist {
            top: 40px;
            left: 20px;
            opacity: ${({ gameOver }) => (gameOver ? 1 : 0)};
            transform: ${({ gameOver }) =>
                gameOver
                    ? 'scale(1) translate(0, 0)'
                    : 'scale(0) translate(-1500px, 320px)'};
            transition: ${({ gameOver }) =>
                `all ${
                    gameOver ? '600ms' : '0ms'
                } cubic-bezier(0.65, 0, 0.35, 1) ${gameOver ? '50ms' : '0ms'}`};
            transform-origin: left;
        }

        &-avatar {
            bottom: 20px;
            right: 40px;
            opacity: ${({ gameOver }) => (gameOver ? 1 : 0)};
            transform: ${({ gameOver }) =>
                gameOver
                    ? 'scale(1) translate(0, 0)'
                    : 'scale(0) translate(1500px, -320px)'};
            transition: ${({ gameOver }) =>
                `all ${
                    gameOver ? '600ms' : '0ms'
                } cubic-bezier(0.65, 0, 0.35, 1) ${
                    gameOver ? '200ms' : '0ms'
                }`};
            transform-origin: right;
        }
    }
`;
