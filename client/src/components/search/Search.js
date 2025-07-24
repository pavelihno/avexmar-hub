import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import Base from '../Base';

const fakeFlights = [
  {
    id: 1,
    airline: 'Avex Air',
    from: 'SVO',
    to: 'PKC',
    departure: '2025-07-24 09:00',
    arrival: '2025-07-24 16:00',
    price: 12000,
  },
  {
    id: 2,
    airline: 'Avex Air',
    from: 'SVO',
    to: 'PKC',
    departure: '2025-07-24 13:00',
    arrival: '2025-07-24 20:00',
    price: 13500,
  },
];

const Search = () => {
  const [params] = useSearchParams();
  const from = params.get('from');
  const to = params.get('to');

  return (
    <Base>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Результаты поиска
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          {from && to ? `${from} → ${to}` : ''}
        </Typography>
        {fakeFlights.map((f) => (
          <Paper key={f.id} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">{f.airline}</Typography>
            <Typography>{`${f.from} - ${f.to}`}</Typography>
            <Typography>{`${f.departure} - ${f.arrival}`}</Typography>
            <Typography>Цена: {f.price} ₽</Typography>
          </Paper>
        ))}
      </Box>
    </Base>
  );
};

export default Search;
