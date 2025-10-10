import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	Alert,
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Fade,
	FormControlLabel,
	Grid,
	IconButton,
	Paper,
	Stack,
	Switch,
	Tooltip,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ImageIcon from '@mui/icons-material/Image';
import UploadIcon from '@mui/icons-material/Upload';

import Base from '../Base';
import PosterCarousel from '../home/PosterCarousel';
import {
	fetchCarouselSlides,
	createCarouselSlide,
	updateCarouselSlide,
	deleteCarouselSlide,
	uploadCarouselSlideImage,
} from '../../redux/actions/carouselSlide';
import { fetchRoutes } from '../../redux/actions/route';
import { fetchAirports } from '../../redux/actions/airport';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES } from '../../constants';
import { FIELD_TYPES } from '../utils';
import { createAdminManager, extractErrorMessage, validateFormFields } from './utils';

const NO_ROUTE_VALUE = '__NO_ROUTE__';

const createEmptyFormValues = () => ({
	id: null,
	title: '',
	routeId: NO_ROUTE_VALUE,
	badge: '',
	alt: '',
	description: '',
	isActive: false,
	displayOrder: 0,
});

const CarouselSlideManagement = () => {
	const dispatch = useDispatch();

	const { carouselSlides, isLoading: slidesLoading } = useSelector((state) => state.carouselSlides);
	const { routes, isLoading: routesLoading } = useSelector((state) => state.routes);
	const { airports, isLoading: airportsLoading } = useSelector((state) => state.airports);

	const [localSlides, setLocalSlides] = useState([]);
	const [formMode, setFormMode] = useState('create');
	const [formOpen, setFormOpen] = useState(false);
	const [formErrors, setFormErrors] = useState({});
	const [formValues, setFormValues] = useState(createEmptyFormValues);
	const [imagePreview, setImagePreview] = useState(null);
	const [imageFile, setImageFile] = useState(null);
	const [deleteDialog, setDeleteDialog] = useState({ open: false, slide: null });
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isReordering, setIsReordering] = useState(false);
	const [processingSlideId, setProcessingSlideId] = useState(null);
	const [successMessage, setSuccessMessage] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	const fileInputRef = useRef(null);
	const closeTimerRef = useRef(null);

	const showSuccess = (message) => {
		if (!message) return;
		setSuccessMessage(message);
		setErrorMessage('');
	};

	const showError = (message) => {
		setErrorMessage(message || UI_LABELS.ERRORS.unknown);
		setSuccessMessage('');
	};

	const clearCloseTimer = () => {
		if (closeTimerRef.current) {
			clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}
	};

	useEffect(() => {
		dispatch(fetchCarouselSlides());
		dispatch(fetchRoutes());
		dispatch(fetchAirports());
	}, [dispatch]);

	useEffect(() => () => clearCloseTimer(), []);

	useEffect(() => {
		if (!Array.isArray(carouselSlides)) {
			setLocalSlides([]);
			return;
		}

		const sorted = carouselSlides
			.map((slide, index) => ({
				...slide,
				display_order: slide.display_order ?? index,
			}))
			.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

		setLocalSlides(sorted);
	}, [carouselSlides]);

	useEffect(() => {
		if (!Array.isArray(carouselSlides) || carouselSlides.length === 0) return;

		const sorted = carouselSlides.slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

		const updates = [];
		sorted.forEach((slide, index) => {
			const expected = index;
			const current = slide.display_order ?? index;
			if (current !== expected) {
				updates.push({ id: slide.id, display_order: expected });
			}
		});

		if (updates.length) {
			Promise.all(
				updates.map((item) =>
					dispatch(updateCarouselSlide({ id: item.id, display_order: item.display_order })).unwrap()
				)
			).catch(() => {});
		}
	}, [carouselSlides, dispatch]);

	useEffect(
		() => () => {
			revokePreview(imagePreview);
		},
		[imagePreview]
	);

	const airportsById = {};
	(airports || []).forEach((airport) => {
		if (airport && airport.id != null) {
			airportsById[airport.id] = airport;
		}
	});

	const formatAirportLabel = (airportId) => {
		const airport = airportId ? airportsById[airportId] : null;
		if (!airport) return '';

		const parts = [];

		if (airport.city_name) parts.push(airport.city_name);
		else if (airport.city_code) parts.push(airport.city_code);
		else if (airport.name) parts.push(airport.name);

		if (airport.iata_code) parts.push(`(${airport.iata_code})`);
		else if (airport.icao_code) parts.push(`(${airport.icao_code})`);

		return parts.join(' ').trim();
	};

	const routesById = {};
	(routes || []).forEach((route) => {
		if (route && route.id != null) {
			routesById[route.id] = route;
		}
	});

	const getRouteLabel = (routeId) => {
		if (!routeId || routeId === NO_ROUTE_VALUE) return UI_LABELS.ADMIN.carousel_slides.no_route_option;
		const route = routesById[routeId];
		if (!route) return UI_LABELS.ADMIN.carousel_slides.no_route_option;

		const from = formatAirportLabel(route.origin_airport_id);
		const to = formatAirportLabel(route.destination_airport_id);

		return `${from} → ${to}`;
	};

	const routeOptions = Object.values(routesById)
		.map((route) => ({
			value: route.id,
			label: getRouteLabel(route.id),
		}))
		.filter(
			(option) =>
				option.value != null && option.label && option.label !== UI_LABELS.ADMIN.carousel_slides.no_route_option
		)
		.sort((a, b) => a.label.localeCompare(b.label, 'ru', { sensitivity: 'base' }));

	const routeSelectOptions = [
		{ value: NO_ROUTE_VALUE, label: UI_LABELS.ADMIN.carousel_slides.no_route_option },
		...routeOptions,
	];

	const fields = {
		id: { key: 'id', apiKey: 'id' },
		title: {
			key: 'title',
			apiKey: 'title',
			label: FIELD_LABELS.CAROUSEL_SLIDE.title,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
			toApi: (value) => (value ?? '').trim(),
			validate: (value) => (!value || !value.trim() ? VALIDATION_MESSAGES.CAROUSEL_SLIDE.title.REQUIRED : null),
		},
		routeId: {
			key: 'routeId',
			apiKey: 'route_id',
			label: FIELD_LABELS.CAROUSEL_SLIDE.route_id,
			type: FIELD_TYPES.SELECT,
			fullWidth: true,
			options: routeSelectOptions,
			displayEmpty: true,
			simpleSelect: true,
			defaultValue: NO_ROUTE_VALUE,
			toApi: (value) => (value === NO_ROUTE_VALUE ? null : value),
			toUi: (value) => (value == null ? NO_ROUTE_VALUE : value),
		},
		badge: {
			key: 'badge',
			apiKey: 'badge',
			label: FIELD_LABELS.CAROUSEL_SLIDE.badge,
			type: FIELD_TYPES.TEXT,
			fullWidth: false,
			toApi: (value) => {
				const trimmed = (value ?? '').trim();
				return trimmed === '' ? null : trimmed;
			},
			defaultValue: '',
		},
		alt: {
			key: 'alt',
			apiKey: 'alt',
			label: FIELD_LABELS.CAROUSEL_SLIDE.alt,
			type: FIELD_TYPES.TEXT,
			fullWidth: false,
			toApi: (value) => (value ?? '').trim(),
			validate: (value) => (!value || !value.trim() ? VALIDATION_MESSAGES.CAROUSEL_SLIDE.alt.REQUIRED : null),
		},
		description: {
			key: 'description',
			apiKey: 'description',
			label: FIELD_LABELS.CAROUSEL_SLIDE.description,
			type: FIELD_TYPES.TEXT_AREA,
			rows: 4,
			fullWidth: true,
			toApi: (value) => {
				const trimmed = (value ?? '').trim();
				return trimmed === '' ? null : trimmed;
			},
			defaultValue: '',
		},
		isActive: {
			key: 'isActive',
			apiKey: 'is_active',
			label: FIELD_LABELS.CAROUSEL_SLIDE.is_active,
			type: FIELD_TYPES.BOOLEAN,
			fullWidth: true,
			defaultValue: false,
			toApi: (value) => !!value,
		},
		displayOrder: {
			key: 'displayOrder',
			apiKey: 'display_order',
			defaultValue: 0,
			excludeFromForm: true,
			toApi: (value) => {
				const numeric = Number(value);
				return Number.isFinite(numeric) ? numeric : 0;
			},
			toUi: (value) => (typeof value === 'number' ? value : 0),
		},
	};

	const { formFields, toApiFormat, toUiFormat } = createAdminManager(fields, {
		addButtonText: () => UI_LABELS.ADMIN.carousel_slides.add_button,
		editButtonText: () => UI_LABELS.ADMIN.carousel_slides.edit_button,
	});

	const revokePreview = (preview) => {
		if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
			URL.revokeObjectURL(preview);
		}
	};

	const resetFormState = (overrides = {}) => {
		setFormValues({ ...createEmptyFormValues(), ...overrides });
		setFormErrors({});
		setImageFile(null);
		setImagePreview((prev) => {
			revokePreview(prev);
			return null;
		});
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const hasSlides = localSlides.length > 0;
	const loadingInitialSlides = slidesLoading && localSlides.length === 0;

	const handleOpenCreate = () => {
		clearCloseTimer();
		resetFormState({ displayOrder: localSlides.length });
		setFormMode('create');
		setSuccessMessage('');
		setErrorMessage('');
		setFormOpen(true);
	};

	const handleOpenEdit = (slide) => {
		clearCloseTimer();
		const formatted = toUiFormat(slide);
		setFormMode('edit');
		setSuccessMessage('');
		setErrorMessage('');
		resetFormState(formatted);
		setImagePreview(slide.image_url || null);
		setFormOpen(true);
	};

	const handleCloseForm = () => {
		if (isSubmitting) return;
		clearCloseTimer();
		setFormOpen(false);
		resetFormState();
		setSuccessMessage('');
		setErrorMessage('');
	};

	const handleFieldChange = (field, value) => {
		setFormValues((prev) => ({ ...prev, [field]: value }));
		if (formErrors[field]) {
			setFormErrors((prev) => {
				const { [field]: _removed, ...rest } = prev;
				return rest;
			});
		}
	};

	const handleSelectImage = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setImageFile(file);
		const previewUrl = URL.createObjectURL(file);
		setImagePreview((prev) => {
			revokePreview(prev);
			return previewUrl;
		});

		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}

		if (formErrors.image) {
			setFormErrors((prev) => {
				const { image, ...rest } = prev;
				return rest;
			});
		}
	};

	const handleSubmitForm = async () => {
		const requireImage = !imagePreview;
		const validationErrors = validateFormFields(formFields, formValues);

		if (requireImage) {
			validationErrors.image = VALIDATION_MESSAGES.CAROUSEL_SLIDE.image.REQUIRED;
		}

		if (Object.keys(validationErrors).length > 0) {
			setFormErrors(validationErrors);
			if (validationErrors.image) {
				showError(validationErrors.image);
			}
			return;
		}

		setIsSubmitting(true);
		try {
			const payload = toApiFormat({
				...formValues,
				displayOrder: formMode === 'create' ? localSlides.length : formValues.displayOrder ?? 0,
			});
			if (formMode === 'create') {
				payload.is_active = false;
			}

			let targetId = formValues.id;

			if (formMode === 'create') {
				const created = await dispatch(createCarouselSlide(payload)).unwrap();
				targetId = created.id;
			} else {
				await dispatch(updateCarouselSlide({ id: formValues.id, ...payload })).unwrap();
			}

			if (imageFile && targetId) {
				await dispatch(uploadCarouselSlideImage({ id: targetId, file: imageFile })).unwrap();
			}

			await dispatch(fetchCarouselSlides()).unwrap();

			showSuccess(formMode === 'create' ? UI_LABELS.SUCCESS.add : UI_LABELS.SUCCESS.update);
			clearCloseTimer();
			closeTimerRef.current = setTimeout(() => {
				setFormOpen(false);
				resetFormState();
				setSuccessMessage('');
				closeTimerRef.current = null;
			}, 1000);
		} catch (error) {
			clearCloseTimer();
			showError(extractErrorMessage(error) || UI_LABELS.ERRORS.unknown);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleToggleActive = async (slide) => {
		setProcessingSlideId(slide.id);
		try {
			await dispatch(updateCarouselSlide({ id: slide.id, is_active: !slide.is_active })).unwrap();
			await dispatch(fetchCarouselSlides()).unwrap();
			showSuccess(UI_LABELS.SUCCESS.update);
		} catch (error) {
			showError(extractErrorMessage(error) || UI_LABELS.ERRORS.unknown);
		} finally {
			setProcessingSlideId(null);
		}
	};

	const handleMoveSlide = async (slideId, direction) => {
		if (!Array.isArray(localSlides) || localSlides.length < 2) return;

		const sorted = localSlides
			.slice()
			.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
			.map((slide) => ({ ...slide }));

		const currentIndex = sorted.findIndex((slide) => slide.id === slideId);
		if (currentIndex < 0) return;

		const targetIndex = currentIndex + direction;
		if (targetIndex < 0 || targetIndex >= sorted.length) return;

		setIsReordering(true);
		try {
			const [moved] = sorted.splice(currentIndex, 1);
			sorted.splice(targetIndex, 0, moved);

			const updates = [];
			sorted.forEach((slide, index) => {
				if (slide.display_order !== index) {
					updates.push({ id: slide.id, display_order: index });
					slide.display_order = index;
				}
			});

			setLocalSlides(sorted);

			if (updates.length) {
				await Promise.all(
					updates.map((item) =>
						dispatch(updateCarouselSlide({ id: item.id, display_order: item.display_order })).unwrap()
					)
				);
				await dispatch(fetchCarouselSlides()).unwrap();
			}

			showSuccess(UI_LABELS.SUCCESS.update);
		} catch (error) {
			showError(extractErrorMessage(error) || UI_LABELS.ERRORS.unknown);
		} finally {
			setIsReordering(false);
		}
	};

	const handleOpenDeleteDialog = (slide) => {
		setDeleteDialog({ open: true, slide });
	};

	const handleCloseDeleteDialog = () => {
		if (processingSlideId) return;
		setDeleteDialog({ open: false, slide: null });
	};

	const handleDeleteSlide = async () => {
		if (!deleteDialog.slide) return;
		const slide = deleteDialog.slide;

		setProcessingSlideId(slide.id);
		try {
			setLocalSlides((prev) => prev.filter((item) => item.id !== slide.id));
			await dispatch(deleteCarouselSlide(slide.id)).unwrap();
			showSuccess(UI_LABELS.SUCCESS.delete);
		} catch (error) {
			showError(extractErrorMessage(error) || UI_LABELS.ERRORS.unknown);
		} finally {
			setProcessingSlideId(null);
			setDeleteDialog({ open: false, slide: null });
		}
	};

	return (
		<Base>
			<Box sx={{ p: 3 }}>
				<Stack spacing={3}>
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						alignItems={{ xs: 'flex-start', md: 'center' }}
						justifyContent='space-between'
						spacing={2}
					>
						<Box>
							<Typography variant='h3' sx={{ mb: 0.5 }}>
								{UI_LABELS.ADMIN.carousel_slides.title}
							</Typography>
							<Typography variant='body1' color='text.secondary'>
								{UI_LABELS.ADMIN.carousel_slides.description}
							</Typography>
						</Box>
						<Button
							variant='contained'
							startIcon={<AddIcon />}
							onClick={handleOpenCreate}
							disabled={isSubmitting || slidesLoading}
						>
							{UI_LABELS.ADMIN.carousel_slides.add_button}
						</Button>
					</Stack>

					<Grid container spacing={3}>
						<Grid item xs={12}>
							<Paper variant='outlined' sx={{ p: 3 }}>
								<Stack spacing={2}>
									<Typography variant='h4'>{UI_LABELS.ADMIN.carousel_slides.management}</Typography>
									<Typography variant='body2' color='text.secondary'>
										{UI_LABELS.ADMIN.carousel_slides.image_hint}
									</Typography>
									<Divider />

									{loadingInitialSlides ? (
										<Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
											<CircularProgress size={32} />
										</Box>
									) : !hasSlides ? (
										<Stack spacing={1} alignItems='center' sx={{ py: 6 }}>
											<ImageIcon color='disabled' fontSize='large' />
											<Typography variant='body2' color='text.secondary' align='center'>
												{UI_LABELS.HOME.poster_carousel.empty}
											</Typography>
										</Stack>
									) : (
										<Stack spacing={2}>
											{localSlides.map((slide, index) => (
												<Paper
													variant='outlined'
													key={slide.id}
													sx={{
														p: 2,
														display: 'flex',
														gap: 2,
														alignItems: 'stretch',
													}}
												>
													<Avatar
														variant='rounded'
														src={slide.image_url || undefined}
														alt={slide.alt || slide.title || 'preview'}
														sx={{
															width: 96,
															height: 72,
															bgcolor: 'grey.100',
															color: 'text.secondary',
															flexShrink: 0,
														}}
													>
														<ImageIcon fontSize='small' />
													</Avatar>
													<Stack spacing={1} sx={{ flexGrow: 1 }}>
														<Stack
															direction='row'
															alignItems='flex-start'
															justifyContent='space-between'
															spacing={1}
														>
															<Box>
																<Typography
																	variant='h6'
																	sx={{ wordBreak: 'break-word' }}
																>
																	{slide.title}
																</Typography>
																<Typography variant='body2' color='text.secondary'>
																	{getRouteLabel(slide.route_id)}
																</Typography>
															</Box>
															<Chip
																size='small'
																variant='outlined'
																label={`#${(slide.display_order ?? index) + 1}`}
															/>
														</Stack>
														{slide.badge && (
															<Chip
																size='small'
																color='primary'
																variant='outlined'
																label={slide.badge}
																sx={{ alignSelf: 'flex-start' }}
															/>
														)}
														{slide.description && (
															<Typography
																variant='body2'
																color='text.secondary'
																sx={{
																	display: '-webkit-box',
																	WebkitLineClamp: 2,
																	WebkitBoxOrient: 'vertical',
																	overflow: 'hidden',
																}}
															>
																{slide.description}
															</Typography>
														)}

														<Stack
															direction={{ xs: 'column', sm: 'row' }}
															alignItems={{ xs: 'flex-start', sm: 'center' }}
															justifyContent='space-between'
															spacing={1}
														>
															<Stack direction='row' spacing={1} alignItems='center'>
																<Chip
																	size='small'
																	color={slide.is_active ? 'success' : 'default'}
																	variant={slide.is_active ? 'filled' : 'outlined'}
																	label={slide.is_active ? 'Активен' : 'Скрыт'}
																/>
																<FormControlLabel
																	control={
																		<Switch
																			checked={!!slide.is_active}
																			onChange={() => handleToggleActive(slide)}
																			color='primary'
																			disabled={
																				isReordering ||
																				processingSlideId === slide.id ||
																				slidesLoading
																			}
																		/>
																	}
																	label={FIELD_LABELS.CAROUSEL_SLIDE.is_active}
																/>
															</Stack>
															<Stack direction='row' spacing={1}>
																<Tooltip title='Переместить вверх'>
																	<span>
																		<IconButton
																			size='small'
																			onClick={() =>
																				handleMoveSlide(slide.id, -1)
																			}
																			disabled={isReordering || index === 0}
																		>
																			<ArrowUpwardIcon fontSize='small' />
																		</IconButton>
																	</span>
																</Tooltip>
																<Tooltip title='Переместить вниз'>
																	<span>
																		<IconButton
																			size='small'
																			onClick={() => handleMoveSlide(slide.id, 1)}
																			disabled={
																				isReordering ||
																				index === localSlides.length - 1
																			}
																		>
																			<ArrowDownwardIcon fontSize='small' />
																		</IconButton>
																	</span>
																</Tooltip>
																<Tooltip title={UI_LABELS.BUTTONS.edit}>
																	<span>
																		<IconButton
																			size='small'
																			onClick={() => handleOpenEdit(slide)}
																			disabled={
																				isReordering ||
																				slidesLoading ||
																				processingSlideId === slide.id
																			}
																		>
																			<EditIcon fontSize='small' />
																		</IconButton>
																	</span>
																</Tooltip>
																<Tooltip title={UI_LABELS.BUTTONS.delete}>
																	<span>
																		<IconButton
																			size='small'
																			color='error'
																			onClick={() =>
																				handleOpenDeleteDialog(slide)
																			}
																			disabled={
																				processingSlideId === slide.id ||
																				isReordering
																			}
																		>
																			<DeleteIcon fontSize='small' />
																		</IconButton>
																	</span>
																</Tooltip>
															</Stack>
														</Stack>
													</Stack>
												</Paper>
											))}
										</Stack>
									)}
								</Stack>
							</Paper>
						</Grid>

						<Grid item xs={12}>
							<Paper variant='outlined' sx={{ p: 3 }}>
								<Stack spacing={2}>
									<Typography variant='h4'>
										{UI_LABELS.ADMIN.carousel_slides.preview_title}
									</Typography>
									<PosterCarousel slides={localSlides} autoFetch={false} includeInactive />
								</Stack>
							</Paper>
						</Grid>
					</Grid>
				</Stack>
			</Box>

			<Dialog open={formOpen} onClose={handleCloseForm} fullWidth maxWidth='md'>
				<DialogTitle>
					{formMode === 'create'
						? UI_LABELS.ADMIN.carousel_slides.add_button
						: UI_LABELS.ADMIN.carousel_slides.edit_button}
				</DialogTitle>
				<DialogContent dividers>
					<Box sx={{ mb: 3 }}>
						<Fade in={!!errorMessage} timeout={300}>
							<div>{errorMessage && <Alert severity='error'>{errorMessage}</Alert>}</div>
						</Fade>
						<Fade in={!!successMessage} timeout={300}>
							<div>{successMessage && <Alert severity='success'>{successMessage}</Alert>}</div>
						</Fade>
					</Box>

					<Grid container spacing={2}>
						{formFields.map((field) => {
							const isActivationField = field.name === 'isActive';
							return (
								<Grid item xs={12} sm={field.fullWidth ? 12 : 6} key={field.name}>
									<Stack spacing={isActivationField && formMode === 'create' ? 0.5 : 0}>
										{field.renderField({
											value: formValues[field.name],
											onChange: (value) => handleFieldChange(field.name, value),
											fullWidth: true,
											error: !!formErrors[field.name],
											helperText: formErrors[field.name],
											options: field.options,
											disabled: formMode === 'create' && isActivationField,
										})}
										{isActivationField && formMode === 'create' && (
											<Typography variant='caption' color='text.secondary'>
												{UI_LABELS.ADMIN.carousel_slides.activation_hint}
											</Typography>
										)}
									</Stack>
								</Grid>
							);
						})}

						<Grid item xs={12}>
							<Stack spacing={1.5}>
								<Button
									variant='outlined'
									startIcon={<UploadIcon />}
									component='label'
									disabled={isSubmitting}
								>
									{imagePreview ? 'Заменить изображение' : FIELD_LABELS.CAROUSEL_SLIDE.image}
									<input
										type='file'
										accept='image/*'
										hidden
										ref={fileInputRef}
										onChange={handleSelectImage}
									/>
								</Button>
								{formErrors.image && (
									<Typography variant='caption' color='error'>
										{formErrors.image}
									</Typography>
								)}
								{imagePreview && (
									<Box
										component='img'
										src={imagePreview}
										alt={formValues.alt || formValues.title || 'preview'}
										sx={{
											width: '100%',
											maxHeight: '50vh',
											objectFit: 'contain',
											borderRadius: 2,
											border: '1px solid',
											borderColor: 'divider',
											backgroundColor: 'background.default',
											mx: 'auto',
										}}
									/>
								)}
								<Typography variant='caption' color='text.secondary'>
									{UI_LABELS.ADMIN.carousel_slides.image_hint}
								</Typography>
							</Stack>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseForm} disabled={isSubmitting}>
						{UI_LABELS.BUTTONS.cancel}
					</Button>
					<Button
						variant='contained'
						onClick={handleSubmitForm}
						disabled={isSubmitting || routeOptions.length === 0}
					>
						{formMode === 'create' ? UI_LABELS.BUTTONS.add : UI_LABELS.BUTTONS.save_changes}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={deleteDialog.open} onClose={handleCloseDeleteDialog}>
				<DialogTitle>{UI_LABELS.MESSAGES.confirm_action}</DialogTitle>
				<DialogContent dividers>
					<Typography variant='body1' sx={{ mb: 2 }}>
						{UI_LABELS.MESSAGES.confirm_delete}
					</Typography>
					{deleteDialog.slide && (
						<Paper variant='outlined' sx={{ p: 2 }}>
							<Typography variant='subtitle1'>{deleteDialog.slide.title}</Typography>
							<Typography variant='body2' color='text.secondary'>
								{getRouteLabel(deleteDialog.slide.route_id)}
							</Typography>
						</Paper>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseDeleteDialog} disabled={processingSlideId !== null}>
						{UI_LABELS.BUTTONS.cancel}
					</Button>
					<Button color='error' onClick={handleDeleteSlide} disabled={processingSlideId !== null}>
						{UI_LABELS.BUTTONS.delete}
					</Button>
				</DialogActions>
			</Dialog>
		</Base>
	);
};

export default CarouselSlideManagement;
