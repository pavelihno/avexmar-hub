import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, Container, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import { DescriptionOutlined, PrintOutlined, DownloadOutlined } from '@mui/icons-material';
import DOMPurify from 'dompurify';
import { useDispatch, useSelector } from 'react-redux';
import Base from './Base';
import { fetchLatestConsentDoc } from '../redux/actions/consentDoc';

// утилита: добавляет id к h2/h3 для оглавления
function addHeadingIds(html) {
	const doc = new DOMParser().parseFromString(html, 'text/html');
	const headings = Array.from(doc.querySelectorAll('h2, h3'));
	headings.forEach((h) => {
		if (!h.id) {
			const slug = h.textContent
				.trim()
				.toLowerCase()
				.replace(/[^\p{L}\p{N}\s-]/gu, '')
				.replace(/\s+/g, '-')
				.slice(0, 80);
			h.id = slug || `h-${Math.random().toString(36).slice(2, 7)}`;
		}
	});
	return doc.body.innerHTML;
}

const proseSx = {
	// «прозовый» стиль для юридического текста
	typography: 'body1',
	lineHeight: 1.7,
	'& h1, & h2, & h3': { fontWeight: 600, mt: 3, mb: 1.5, lineHeight: 1.25 },
	'& h2': {
		fontSize: { xs: '1.125rem', md: '1.25rem' },
		borderBottom: (t) => `1px solid ${t.palette.divider}`,
		pb: 0.5,
	},
	'& h3': { fontSize: { xs: '1rem', md: '1.1rem' }, mt: 2.5 },
	'& p': { my: 1.2 },
	'& ul, & ol': { my: 1.2, pl: 3 },
	'& li + li': { mt: 0.5 },
	'& a': {
		color: 'primary.main',
		textDecoration: 'none',
		'&:hover': { textDecoration: 'underline' },
		wordBreak: 'break-word',
	},
	'& blockquote': {
		my: 2,
		pl: 2,
		borderLeft: (t) => `4px solid ${t.palette.divider}`,
		color: 'text.secondary',
	},
	'& table': {
		width: '100%',
		borderCollapse: 'collapse',
		my: 2,
		'& th, & td': {
			border: (t) => `1px solid ${t.palette.divider}`,
			p: 1,
			verticalAlign: 'top',
		},
		'& th': { bgcolor: 'action.hover' },
	},
};

const tocBoxSx = {
	position: { md: 'sticky' },
	top: { md: 24 },
	borderLeft: { md: (t) => `1px dashed ${t.palette.divider}` },
	pl: { md: 2 },
	ml: { md: 2 },
	mt: { xs: 2, md: 0 },
	'& a': {
		display: 'block',
		py: 0.5,
		color: 'text.secondary',
		fontSize: '0.9rem',
		textDecoration: 'none',
		'&:hover': { color: 'text.primary', textDecoration: 'underline' },
	},
};

const ConsentDocPage = ({ type, title }) => {
	const dispatch = useDispatch();
	const { consentDoc } = useSelector((s) => s.consentDocs) || {};
	const contentRaw = consentDoc?.content || '';
	const effectiveDate = consentDoc?.effective_date || consentDoc?.updated_at || null;
	const version = consentDoc?.version || null;

	const containerRef = useRef(null);
	const [toc, setToc] = useState([]);

	// грузим последний документ
	useEffect(() => {
		dispatch(fetchLatestConsentDoc(type));
	}, [dispatch, type]);

	// санитизируем + добавляем id заголовкам
	const contentHtml = useMemo(() => {
		const withIds = addHeadingIds(contentRaw);
		return DOMPurify.sanitize(withIds, { USE_PROFILES: { html: true } });
	}, [contentRaw]);

	// строим оглавление после монтирования контента
	useEffect(() => {
		if (!containerRef.current) return;
		const hs = containerRef.current.querySelectorAll('h2, h3');
		const entries = Array.from(hs).map((el) => ({
			id: el.id,
			text: el.textContent || '',
			level: el.tagName.toLowerCase(),
		}));
		setToc(entries);
	}, [contentHtml]);

	const handlePrint = () => window.print();

	// (опционально) «скачать как HTML» — компактно и без PDF-генерации на клиенте
	const handleDownload = () => {
		const blob = new Blob(
			[
				`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${contentHtml}</body></html>`,
			],
			{ type: 'text/html;charset=utf-8' }
		);
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${type || 'document'}.html`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<Base>
			<Container maxWidth='md' sx={{ py: { xs: 3, md: 5 } }}>
				{/* Шапка */}
				<Paper
					elevation={0}
					sx={{ p: { xs: 2, md: 3 }, border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 2 }}
				>
					<Stack direction='row' spacing={2} alignItems='center'>
						<DescriptionOutlined fontSize='large' />
						<Box sx={{ flex: 1 }}>
							<Typography variant='h4' component='h1'>
								{title}
							</Typography>
							<Stack direction='row' spacing={1} flexWrap='wrap' sx={{ mt: 1 }}>
								{version && <Chip size='small' label={`Версия: ${version}`} />}
								{effectiveDate && (
									<Chip
										size='small'
										color='default'
										variant='outlined'
										label={`Действует с: ${new Date(effectiveDate).toLocaleDateString()}`}
									/>
								)}
							</Stack>
						</Box>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
							<Button onClick={handlePrint} startIcon={<PrintOutlined />} variant='outlined'>
								Печать
							</Button>
							<Button onClick={handleDownload} startIcon={<DownloadOutlined />} variant='contained'>
								Скачать
							</Button>
						</Stack>
					</Stack>
				</Paper>

				<Divider sx={{ my: { xs: 2, md: 3 } }} />

				{/* Контент + оглавление */}
				<Grid container spacing={3}>
					<Grid item xs={12} md={8.5}>
						<Paper
							elevation={0}
							sx={{
								p: { xs: 2, md: 3 },
								border: (t) => `1px solid ${t.palette.divider}`,
								borderRadius: 2,
								'& *:first-of-type': { mt: 0 }, // убираем верхний отступ у первого заголовка
							}}
						>
							<Box ref={containerRef} sx={proseSx} dangerouslySetInnerHTML={{ __html: contentHtml }} />
							<Divider sx={{ my: 3 }} />
							<Typography variant='caption' color='text.secondary'>
								Последнее обновление:{' '}
								{consentDoc?.updated_at ? new Date(consentDoc.updated_at).toLocaleString() : '—'}
							</Typography>
						</Paper>
					</Grid>

					<Grid item xs={12} md={3.5}>
						<Paper
							elevation={0}
							sx={{ p: 2, border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 2 }}
						>
							<Typography variant='subtitle2' gutterBottom>
								Оглавление
							</Typography>
							<Box sx={tocBoxSx}>
								{toc.length === 0 ? (
									<Typography variant='body2' color='text.secondary'>
										Заголовки будут показаны здесь
									</Typography>
								) : (
									toc.map(({ id, text, level }) => (
										<Box key={id} sx={{ pl: level === 'h3' ? 2 : 0 }}>
											<a href={`#${id}`}>{text}</a>
										</Box>
									))
								)}
							</Box>
						</Paper>
					</Grid>
				</Grid>
			</Container>
		</Base>
	);
};

export default ConsentDocPage;
