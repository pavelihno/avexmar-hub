import { createCrudActions } from '../utils';

export const {
	fetchAll: fetchCarouselSlides,
	fetchOne: fetchCarouselSlide,
	create: createCarouselSlide,
	update: updateCarouselSlide,
	remove: deleteCarouselSlide,
	removeAll: deleteAllCarouselSlides,
} = createCrudActions('carousel_slides');
