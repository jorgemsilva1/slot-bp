import { useMemo } from 'preact/hooks';
import styled from 'styled-components';

export const BgController = ({
    backgroundId,
    wonLasVegas = false,
}: {
    backgroundId: 'one' | 'two' | 'go';
    wonLasVegas?: boolean;
}) => {
    const Element = useMemo(() => {
        switch (backgroundId) {
            case 'go':
                return <Background wonLasVegas={wonLasVegas} bg="go" />;
            case 'two':
                return <Background wonLasVegas={wonLasVegas} bg="two" />;
            default:
                return <Background wonLasVegas={wonLasVegas} bg="one" />;
        }
    }, [backgroundId]);

    return Element;
};

const Background = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${({ bg, wonLasVegas }) =>
        wonLasVegas
            ? "url('/img/bg_lasvegas.png')"
            : `url('/img/bg_${bg}.png')`};
`;
