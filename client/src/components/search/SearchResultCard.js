import React from 'react';
import { Card, Box, Typography, Button, Divider } from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';

const Segment = ({ flight }) => {
    if (!flight) return null;
    return (
        <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600, mr: 1 }}>
                    {flight.airline || flight.airline_id}
                </Typography>
                <NightlightRoundIcon fontSize='small' sx={{ ml: 0.5 }} />
                <HourglassBottomIcon fontSize='small' sx={{ ml: 0.5 }} />
                <FavoriteBorderIcon fontSize='small' sx={{ ml: 0.5 }} />
                <ShareIcon fontSize='small' sx={{ ml: 0.5 }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant='h6' className='mono-nums'>
                        {flight.departure_time || flight.scheduled_departure_time || flight.departure || flight.scheduled_departure}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                        {flight.from || flight.origin}
                    </Typography>
                </Box>
                <FlightIcon sx={{ mx: 1 }} />
                <Box>
                    <Typography variant='h6' className='mono-nums'>
                        {flight.arrival_time || flight.scheduled_arrival_time || flight.arrival || flight.scheduled_arrival}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                        {flight.to || flight.destination}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

const SearchResultCard = ({ outbound, returnFlight }) => {
    const price = outbound.price || outbound.min_price || '--';
    return (
        <Card sx={{ display: 'flex', p: 2, mb: 2 }}>
            <Box sx={{ width: 160, textAlign: 'center', pr: 2, borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 1 }}>
                    {price}
                </Typography>
                <Button
                    variant='contained'
                    sx={{
                        background: '#ff7f2a',
                        color: '#fff',
                        borderRadius: 2,
                        boxShadow: 'none',
                        textTransform: 'none',
                        '&:hover': { background: '#ff6600' },
                    }}
                >
                    Обновить
                </Button>
            </Box>
            <Box sx={{ flexGrow: 1, pl: 2 }}>
                <Segment flight={outbound} />
                {returnFlight && <Divider sx={{ my: 1 }} />}
                {returnFlight && <Segment flight={returnFlight} />}
            </Box>
        </Card>
    );
};

export default SearchResultCard;
