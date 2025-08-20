import React, { useEffect, useState } from 'react';
import { Container, Typography, Box } from '@mui/material';

import Base from './Base';
import { serverApi } from '../api';

const ConsentDocPage = ({ type, title }) => {
        const [content, setContent] = useState('');

        useEffect(() => {
                serverApi
                        .get(`/consent_docs/latest/${type}`)
                        .then((res) => setContent(res.data.content || ''))
                        .catch(() => setContent(''));
        }, [type]);

        return (
                <Base>
                        <Container maxWidth='md' sx={{ py: 4 }}>
                                <Typography variant='h4' component='h1' gutterBottom>
                                        {title}
                                </Typography>
                                <Box dangerouslySetInnerHTML={{ __html: content }} />
                        </Container>
                </Base>
        );
};

export default ConsentDocPage;
