import { createSlice } from '@reduxjs/toolkit';
import {
	fetchCarouselSlides,
	fetchCarouselSlide,
	createCarouselSlide,
	updateCarouselSlide,
	deleteCarouselSlide,
	uploadCarouselSlideImage,
} from '../actions/carouselSlide';
import { addCrudCases, handlePending, handleRejected } from '../utils';

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

		builder
			.addCase(uploadCarouselSlideImage.pending, handlePending)
			.addCase(uploadCarouselSlideImage.fulfilled, (state, action) => {
				const updatedSlide = action.payload;

				state.carouselSlides = state.carouselSlides.map((item) =>
					item.id === updatedSlide.id ? updatedSlide : item
				);
				if (state.carouselSlide?.id === updatedSlide.id) {
					state.carouselSlide = updatedSlide;
				}
				state.isLoading = false;
			})
			.addCase(uploadCarouselSlideImage.rejected, handleRejected);
	},
});

export default carouselSlideSlice.reducer;
