import React, { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import html2pdf from 'html2pdf.js';
import DOMPurify from 'dompurify';

import { DescriptionOutlined, DownloadOutlined } from '@mui/icons-material';
import { Box, Button, Chip, Container, Divider, Paper, Stack, Typography } from '@mui/material';

import Base from './Base';
import { fetchLatestConsentDoc } from '../redux/actions/consentDoc';
import { ENUM_LABELS, UI_LABELS } from '../constants';
import { formatDate, formatDateTime } from './utils';

const proseSx = {
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

const ConsentDocPage = ({ type, title }) => {
	const dispatch = useDispatch();
	const { consentDoc } = useSelector((s) => s.consentDocs) || {};
	const contentRaw = consentDoc?.content || '';
	const effectiveDate = consentDoc?.updated_at || null;
	const version = consentDoc?.version || null;

	const hash = consentDoc?.hash_sha256 || null;

	const containerRef = useRef(null);

	useEffect(() => {
		dispatch(fetchLatestConsentDoc(type));
	}, [dispatch, type]);

	const contentHtml = useMemo(() => DOMPurify.sanitize(contentRaw, { USE_PROFILES: { html: true } }), [contentRaw]);

	const handleDownload = async () => {
		if (!containerRef.current) return;
		try {
			const pdfElement = document.createElement('div');
			const header = document.createElement('h1');
			header.textContent = title;
			header.style.textAlign = 'center';
			pdfElement.appendChild(header);
			pdfElement.appendChild(containerRef.current.cloneNode(true));
			const footer = document.createElement('div');
			footer.style.marginTop = '40px';
			footer.style.fontSize = '14px';
			footer.style.textAlign = 'center';
			footer.style.lineHeight = '2';
			footer.innerHTML = [
				UI_LABELS.ABOUT.company_full_name,
				`${UI_LABELS.DOC.version} ${version || UI_LABELS.DOC.not_available} (${UI_LABELS.DOC.last_updated}: ${
					effectiveDate ? formatDateTime(effectiveDate) : UI_LABELS.DOC.not_available
				})`,
				`${hash || UI_LABELS.DOC.not_available}`,
			].join('<br/>');
			pdfElement.appendChild(footer);
			await html2pdf()
				.set({
					margin: [20, 30, 20, 30],
					filename: `${ENUM_LABELS.CONSENT_DOC_TYPE[type] || 'document'}. ${
						UI_LABELS.DOC.version
					} ${version}. ${formatDate(effectiveDate)}.pdf`,
					html2canvas: { scale: 2 },
					jsPDF: {
						unit: 'mm',
						format: 'a4',
						orientation: 'portrait',
					},
				})
				.from(pdfElement)
				.save();
		} catch (err) {
			const blob = new Blob(
				[
					`<!doctype html><html><head><meta charset='utf-8'><title>${title}</title></head><body>${contentHtml}</body></html>`,
				],
				{ type: 'text/html;charset=utf-8' }
			);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${type || 'document'}.html`;
			a.click();
			URL.revokeObjectURL(url);
		}
	};

	return (
		<Base>
			<Container maxWidth='md' sx={{ py: { xs: 3, md: 5 } }}>
				<Paper
					elevation={0}
					sx={{
						p: { xs: 2, md: 3 },
						border: (t) => `1px solid ${t.palette.divider}`,
						borderRadius: 2,
					}}
				>
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						spacing={2}
						alignItems={{ xs: 'stretch', md: 'center' }}
					>
						<DescriptionOutlined fontSize='large' />
						<Box sx={{ flex: 1 }}>
							<Typography variant='h4' component='h1'>
								{title}
							</Typography>
							<Stack direction='row' spacing={1} flexWrap='wrap' sx={{ mt: 1 }}>
								{version && <Chip size='small' label={`${UI_LABELS.DOC.version} ${version}`} />}
								{effectiveDate && (
									<Chip
										size='small'
										color='default'
										variant='outlined'
										label={`${UI_LABELS.DOC.effective_from} ${formatDate(effectiveDate)}`}
									/>
								)}
							</Stack>
						</Box>
						<Button
							onClick={handleDownload}
							startIcon={<DownloadOutlined />}
							variant='contained'
							sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}
						>
							{UI_LABELS.BUTTONS.download}
						</Button>
					</Stack>
				</Paper>

				<Divider sx={{ my: { xs: 2, md: 3 } }} />

				<Paper
					elevation={0}
					sx={{
						p: { xs: 2, md: 3 },
						border: (t) => `1px solid ${t.palette.divider}`,
						borderRadius: 2,
						'& *:first-of-type': { mt: 0 },
					}}
				>
					<Box ref={containerRef} sx={proseSx} dangerouslySetInnerHTML={{ __html: contentHtml }} />
					<Divider sx={{ my: 3 }} />
					<Typography variant='caption' color='text.secondary'>
						{`${UI_LABELS.DOC.last_updated}: ${
							effectiveDate ? formatDateTime(effectiveDate) : UI_LABELS.DOC.not_available
						}`}
					</Typography>
				</Paper>
			</Container>
		</Base>
	);
};

export default ConsentDocPage;
