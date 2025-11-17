import React from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';

const BookingDashboardSummary = ({
	labels,
	summary,
	statusSummary,
	issueSummary,
	statusFilter,
	issueFilter,
	onStatusChipClick,
	onIssueChipClick,
	statusColors,
	issueColors,
	chipSx,
	hasSearched,
}) => (
	<Box sx={{ mt: { xs: 3, md: 4 } }}>
		<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems='stretch'>
			<Paper
				variant='outlined'
				sx={{
					borderRadius: 2,
					px: 2.5,
					py: 2,
					minWidth: { md: 200 },
				}}
			>
				<Typography variant='subtitle2' color='text.secondary' sx={{ fontWeight: 500 }}>
					{labels.total}
				</Typography>
				<Typography variant='h3' sx={{ fontWeight: 600, lineHeight: 1.1 }}>
					{summary.total || 0}
				</Typography>
			</Paper>
			<Paper
				variant='outlined'
				sx={{
					flex: 1,
					borderRadius: 2,
					px: 2.5,
					py: 2,
				}}
			>
				<Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1, fontWeight: 500 }}>
					{labels.statuses}
				</Typography>
				<Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
					{hasSearched && statusSummary.length === 0 && (
						<Typography variant='body2' color='text.secondary'>
							{labels.emptyStatuses}
						</Typography>
					)}
					{statusSummary.map((item) => (
						<Chip
							key={item.status}
							label={`${item.label} · ${item.count}`}
							variant={statusFilter === item.status ? 'filled' : 'outlined'}
							color={statusColors[item.status] || 'default'}
							size='small'
							onClick={() => onStatusChipClick(item.status)}
							clickable
							sx={{
								...chipSx,
								cursor: 'pointer',
								opacity: statusFilter && statusFilter !== item.status ? 0.7 : 1,
							}}
						/>
					))}
				</Box>
			</Paper>
			<Paper
				variant='outlined'
				sx={{
					flex: 1,
					borderRadius: 2,
					px: 2.5,
					py: 2,
				}}
			>
				<Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1, fontWeight: 500 }}>
					{labels.issues}
				</Typography>
				<Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
					{hasSearched && issueSummary.length === 0 && (
						<Typography variant='body2' color='text.secondary'>
							{labels.emptyIssues}
						</Typography>
					)}
					{issueSummary.map((issue) => (
						<Chip
							key={issue.key}
							label={`${issue.label} · ${issue.count}`}
							variant={issueFilter === issue.key ? 'filled' : 'outlined'}
							color={issueColors[issue.key] || 'default'}
							size='small'
							onClick={() => onIssueChipClick(issue.key)}
							clickable
							sx={{
								...chipSx,
								cursor: 'pointer',
								opacity: issueFilter && issueFilter !== issue.key ? 0.7 : 1,
							}}
						/>
					))}
				</Box>
			</Paper>
		</Stack>
	</Box>
);

export default BookingDashboardSummary;
