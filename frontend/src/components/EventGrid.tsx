import type { ReactNode } from 'react';
import { Alert, Box, Button, Card, CardContent, Grid, Skeleton, Typography } from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import type { EventSummary } from '../api/types';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n/i18n';
import { EventCard } from './EventCard';
import { Reveal } from './Reveal';

import { defaultGridSize } from '../lib/grid';

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2, color: 'text.secondary' }}>
      <EventBusyIcon sx={{ fontSize: 56, mb: 1, opacity: 0.6 }} />
      <Typography variant="h6" color="text.primary" gutterBottom>
        {title}
      </Typography>
      {description && <Typography variant="body2">{description}</Typography>}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}

export function EventGrid({
  events,
  isLoading,
  error,
  onRetry,
  empty,
  dimmed,
  gridSize = defaultGridSize,
}: {
  events: EventSummary[] | undefined;
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty: ReactNode;
  /** Render cards slightly faded (e.g. past events). */
  dimmed?: boolean;
  /** Column sizes per breakpoint. */
  gridSize?: Record<string, number>;
}) {
  const { t } = useI18n();

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          )
        }
      >
        {errorMessage(error, t)}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Grid container spacing={2.5}>
        {Array.from({ length: 8 }, (_, i) => (
          <Grid key={i} size={gridSize}>
            <Card>
              <Skeleton variant="rectangular" height={160} />
              <CardContent>
                <Skeleton width="80%" />
                <Skeleton width="60%" />
                <Skeleton width="40%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!events?.length) return <>{empty}</>;

  return (
    <Grid container spacing={2.5}>
      {events.map((e, i) => (
        <Grid key={e.id} size={gridSize}>
          {/* Stagger cards across a row as they scroll into view. */}
          <Reveal delay={(i % 4) * 80}>
            <EventCard event={e} dimmed={dimmed} />
          </Reveal>
        </Grid>
      ))}
    </Grid>
  );
}
