import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Grid, Typography, Card, CardContent, TextField, Checkbox, FormControlLabel, Button, Stepper, Step, StepLabel } from '@mui/material';
import Base from '../Base';
import PassengerForm from '../cart/PassengerForm';

const steps = ['Поиск', 'Пассажиры', 'Проверка и услуги', 'Оплата'];

const Passengers = () => {
    const { publicId } = useParams();
    // Placeholder passengers; in real app this would come from previous step
    const passengers = [{ id: 1, type: 'ADULT' }];
    return (
        <Base maxWidth='lg'>
            <Stepper activeStep={1} alternativeLabel sx={{ mb: 3 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                    {passengers.map((p) => (
                        <PassengerForm key={p.id} passenger={p} />
                    ))}
                    <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, mb: 2 }}>
                        <Typography variant='h6' sx={{ mb: 2 }}>
                            Покупатель
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField label='Фамилия' fullWidth />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label='Имя' fullWidth />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label='Электронная почта' fullWidth />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label='Телефон' fullWidth />
                            </Grid>
                        </Grid>
                        <FormControlLabel
                            sx={{ mt: 2 }}
                            control={<Checkbox />}
                            label='Даю согласие на обработку персональных данных'
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant='h6' gutterBottom>
                                Итого за {passengers.length} пассажира(ов)
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>Билеты</Typography>
                                <Typography>0 ₽</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>Сервисный сбор</Typography>
                                <Typography>0 ₽</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography>Скидка</Typography>
                                <Typography>0 ₽</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant='subtitle1'>Итого</Typography>
                                <Typography variant='subtitle1'>0 ₽</Typography>
                            </Box>
                            <Button variant='contained' fullWidth>
                                Продолжить
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Base>
    );
};

export default Passengers;
