import styled from 'styled-components';

export const PrizeList = ({ arr }: { arr: any[] }) => {
    return (
        <>
            <div className={'blob'} style={{backgroundColor: '#232323', width: '30vw', height: '25vw', position:'absolute', zIndex: 99, top: '19vh', fontSize: '6rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                Game over
            </div>
            <div className={'blob'} style={{position: 'absolute', width: '150vw', height: '60vh', marginTop: '15rem'}}></div>
        <List id="prizes">
            <li style={{fontSize: '6rem', color:'#e25625', fontWeight: 800, fontFamily: 'Futura', marginLeft: '0px'}}>Prémios:</li>
            {arr.map((item, index) => (
                <li key={index} className={item ? 'prize' : ''} style={{textAlign: 'left'}}>
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
