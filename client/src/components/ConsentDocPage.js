import React, { useEffect, useMemo, useRef } from 'react';
import {
	Box,
	Button,
	Chip,
	Container,
	Divider,
	Paper,
	Stack,
	Typography,
} from '@mui/material';
import { DescriptionOutlined, DownloadOutlined } from '@mui/icons-material';
import DOMPurify from 'dompurify';
import { useDispatch, useSelector } from 'react-redux';
import Base from './Base';
import { fetchLatestConsentDoc } from '../redux/actions/consentDoc';
import { UI_LABELS } from '../constants';

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
	const effectiveDate =
		consentDoc?.effective_date || consentDoc?.updated_at || null;
	const version = consentDoc?.version || null;

	const containerRef = useRef(null);

	useEffect(() => {
		dispatch(fetchLatestConsentDoc(type));
	}, [dispatch, type]);

	const contentHtml = useMemo(
		() => DOMPurify.sanitize(contentRaw, { USE_PROFILES: { html: true } }),
		[contentRaw],
	);

	const handleDownload = async () => {
		if (containerRef.current) {
			try {
				const html2pdf = (await import('html2pdf.js')).default;
				await html2pdf()
					.from(containerRef.current)
					.save(`${type || 'document'}.pdf`);
			} catch (err) {
				const blob = new Blob(
					[
						`<!doctype html><html><head><meta charset='utf-8'><title>${title}</title></head><body>${contentHtml}</body></html>`,
					],
					{ type: 'text/html;charset=utf-8' },
				);
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${type || 'document'}.html`;
				a.click();
				URL.revokeObjectURL(url);
			}
		}
	};

	return (
		<Base>
			<Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
				<Paper
					elevation={0}
					sx={{
						p: { xs: 2, md: 3 },
						border: (t) => `1px solid ${t.palette.divider}`,
						borderRadius: 2,
					}}
				>
					<Stack direction="row" spacing={2} alignItems="center">
						<DescriptionOutlined fontSize="large" />
						<Box sx={{ flex: 1 }}>
							<Typography variant="h4" component="h1">
								{title}
							</Typography>
							<Stack
								direction="row"
								spacing={1}
								flexWrap="wrap"
								sx={{ mt: 1 }}
							>
								{version && (
									<Chip
										size="small"
										label={`${UI_LABELS.DOC.version} ${version}`}
									/>
								)}
								{effectiveDate && (
									<Chip
										size="small"
										color="default"
										variant="outlined"
										label={`${UI_LABELS.DOC.effective_from} ${new Date(effectiveDate).toLocaleDateString()}`}
									/>
								)}
							</Stack>
						</Box>
						<Button
							onClick={handleDownload}
							startIcon={<DownloadOutlined />}
							variant="contained"
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
					<Box
						ref={containerRef}
						sx={proseSx}
						dangerouslySetInnerHTML={{ __html: contentHtml }}
					/>
					<Divider sx={{ my: 3 }} />
					<Typography variant="caption" color="text.secondary">
						{UI_LABELS.DOC.last_updated}{' '}
						{consentDoc?.updated_at
							? new Date(consentDoc.updated_at).toLocaleString()
							: UI_LABELS.DOC.not_available}
					</Typography>
				</Paper>
			</Container>
		</Base>
	);
};

export default ConsentDocPage;
