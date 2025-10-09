import { createSlice } from '@reduxjs/toolkit';
import {
	fetchCarouselSlides,
	fetchCarouselSlide,
	createCarouselSlide,
	updateCarouselSlide,
	deleteCarouselSlide,
} from '../actions/carouselSlide';
import { addCrudCases } from '../utils';

const initialState = {
	carouselSlides: [],
	carouselSlide: null,
	isLoading: false,
	errors: null,
};

const carouselSlideSlice = createSlice({
	name: 'carouselSlides',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		addCrudCases(
			builder,
			{
				fetchAll: fetchCarouselSlides,
				fetchOne: fetchCarouselSlide,
				create: createCarouselSlide,
				update: updateCarouselSlide,
				remove: deleteCarouselSlide,
			},
			'carouselSlides',
			'carouselSlide'
		);
	},
});

export default carouselSlideSlice.reducer;
