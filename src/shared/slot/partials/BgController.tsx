import { useMemo } from 'preact/hooks';
import styled from 'styled-components';

export const BgController = ({
    backgroundId,
}: {
    backgroundId: 'one' | 'two' | 'go';
}) => {
    const Element = useMemo(() => {
        switch (backgroundId) {
            case 'go':
                return <Background bg="go" />;
            case 'two':
                return <Background bg="two" />;
            default:
                return <Background bg="one" />;
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
    // background: ${({ bg }) => `url('/img/bg_${bg}.png')`};
`;
