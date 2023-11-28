import styled from 'styled-components';

export const PrizeList = ({ arr }: { arr: any[] }) => {
    return (
        <List id="prizes">
            {arr.map((item, index) => (
                <li key={index} className={item ? 'prize' : ''}>
                    {index + 1}. {item ? item : 'Sem prémio'}
                </li>
            ))}
        </List>
    );
};

const List = styled.ul`
    z-index: 9;
`;
