import styled from 'styled-components';

export const PrizeList = ({ arr }: { arr: any[] }) => {
    console.log(arr);
    return (
        <>
            <div className={'blob'} style={{backgroundColor: '#232323', width: '25vw', height: '20vw', position:'absolute', zIndex: 99, top: '19vh', fontSize: '5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                Game over
            </div>
            <div className={'blob'} style={{position: 'absolute', width: '150vw', height: '60vh', marginTop: '15rem'}}></div>
        <List id="prizes">
            <li style={{fontSize: '6rem', color:'#e25625', fontWeight: 800, fontFamily: 'Futura'}}>Prémios:</li>
            {arr.map((item, index) => (
                <li key={index} className={item ? 'prize' : ''} style={{marginLeft: '-5vw'}}>
                    {index + 1}. {item ? item : 'Sem prémio'}
                </li>
            ))}
        </List>
        </>
    );
};

const List = styled.ul`
    z-index: 9;
    line-height: 14rem;

    li {
        color: #fff;
    }
`;
