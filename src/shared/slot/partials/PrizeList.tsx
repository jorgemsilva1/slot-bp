import styled from 'styled-components';

export const PrizeList = ({ arr }: { arr: any[] }) => {
    return (
        <>
            <List id="prizes">
                <li
                    style={{
                        fontSize: '6rem',
                        color: '#e25625',
                        fontWeight: 800,
                        fontFamily: 'Futura',
                        marginLeft: '0px',
                    }}
                >
                    Prémios
                </li>
                {arr.map((item, index) => (
                    <li
                        key={index}
                        className={item ? 'prize' : ''}
                        style={{
                            textAlign: 'center',
                            fontSize: '9rem',
                            color: 'white',
                            opacity: !item ? '50%' : '100%',
                        }}
                    >
                        {index + 1}. {item ? item : 'Sem prémio'}
                    </li>
                ))}
            </List>
        </>
    );
};

const List = styled.ul`
    z-index: 9;
    line-height: 11rem;
    top: 56rem;
    position: absolute;
    margin-top: 0rem !important;
    li {
        color: #fff;
    }
`;
