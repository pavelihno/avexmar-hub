import React, { useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import 'react-quill/dist/quill.snow.css';

import Base from './Base';
import { fetchLatestConsentDoc } from '../redux/actions/consentDoc';

const ConsentDocPage = ({ type, title }) => {
  const dispatch = useDispatch();
  const content = useSelector(
    (state) => state.consentDocs.consentDoc?.content || '',
  );

  useEffect(() => {
    dispatch(fetchLatestConsentDoc(type));
  }, [dispatch, type]);

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
