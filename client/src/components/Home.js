import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';

import Base from './Base';

const getCard = (cardData) => {
    return <Card sx={{ maxWidth: 405, minHeight: 634 }}>
        <CardMedia>
            <Container
                height={100}
                width={100}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <img src={cardData.icon} alt={cardData.alt} style={{ width: '100px', height: '100px' }} />
            </Container>
        </CardMedia>
        <CardContent>
            <Typography variant='h4' gutterBottom style={{ fontSize: '20px', fontWeight: '600', textAlign: 'center' }}>
                {cardData.title}
            </Typography>
            <Typography variant='body1' gutterBottom style={{ fontSize: '18px' }}>
                {cardData.content}
            </Typography>
        </CardContent>
    </Card>
};

const Home = () => {

    const dispatch = useDispatch();

    const cardsData = [
        {
            icon: 'images/icons/globe.svg',
            alt: 'globe',
            title: 'Широкий спектр клиентов и партнёров в сфере воздушных перевозок',
            content: 'Компания «АВЕКСМАР» является надежным партнером для старательских артелей, предприятий и организаций, таких как ОАО «Полиметалл», Морской порт Певек, ООО «Инкомнефтеремонт», ООО «Уранцветмет», ООО «Атомредметзолото», а также предприятий, связанных с ПАТЭС, обслуживаемых компаниями ООО «Запсибгидрострой», ООО «Ленмонтаж», ООО «Гидропромстрой», ООО «Плавстройотряд-34» и Нововоронежской АЭС',
        },
        {
            icon: 'images/icons/clock.svg',
            alt: 'clock',
            title: 'Опытная компания с богатой историей',
            content: 'Коллектив ООО «АВЕКСМАР» занимается организацией пассажирских и грузовых авиаперевозок с 1995 года. Компания имеет многолетний опыт организации воздушных перевозок пассажиров, проживающих или работающих на территории Чукотского автономного округа',
        },
        {
            icon: 'images/icons/vinyl.svg',
            alt: 'vinyl',
            title: 'Долгосрочное сотрудничество с ведущими авиакомпаниями',
            content: 'Организация сотрудничала с такими авиакомпаниями, как «Внуковские авиалинии», «Красноярские авиалинии», «Авиаэнерго», «Кавминводыавиа», «Трансаэро», «ЮТэйр». С апреля 2017 года ООО «АВЕКСМАР» организует регулярные рейсы по маршруту Москва-Якутск-Певек-Якутск-Москва с авиакомпанией «Якутия». За это время было выполнено более 500 рейсов и перевезено более 55 000 пассажиров',
        },
    ];

    return (
        <Base>
            <Container component='main' maxwidth='lg'>
                <Grid container direction='row'>
                    <Grid item xs>
                        <Typography variant='h3' align='center' gutterBottom style={{ fontWeight: 'bold' }}>
                            О нас
                        </Typography>
                        <Grid container justifyContent='center' spacing={5}>
                            {
                                cardsData.map((cardData, index) => (
                                    <Grid item xs key={index}>
                                        {getCard(cardData)}
                                    </Grid>
                                ))
                            }
                        </Grid>
                    </Grid>
                </Grid>
            </Container>
        </Base>
    );
};

export default Home;