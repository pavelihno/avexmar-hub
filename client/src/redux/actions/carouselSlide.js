import { createAsyncThunk } from '@reduxjs/toolkit';

import { serverApi } from '../../api';
import { createCrudActions, getErrorData } from '../utils';

export const {
	fetchAll: fetchCarouselSlides,
	fetchOne: fetchCarouselSlide,
	create: createCarouselSlide,
	update: updateCarouselSlide,
	remove: deleteCarouselSlide,
	removeAll: deleteAllCarouselSlides,
} = createCrudActions('carousel_slides');

export const uploadCarouselSlideImage = createAsyncThunk(
	'carousel_slides/uploadImage',
	async ({ id, file }, { rejectWithValue }) => {
		try {
			const formData = new FormData();
			formData.append('file', file);

			const res = await serverApi.post(`/carousel_slides/${id}/upload`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			return res.data;
		} catch (err) {
			return rejectWithValue(getErrorData(err));
		}
	}
);
