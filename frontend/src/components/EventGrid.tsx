import type { ReactNode } from 'react';
import { Alert, Box, Button, Card, CardContent, Grid, Skeleton, Typography } from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import type { EventSummary } from '../api/types';
import { errorMessage } from '../api/client';
import { EventCard } from './EventCard';

const gridSize = { xs: 12, sm: 6, md: 4, lg: 3 };

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
}: {
  events: EventSummary[] | undefined;
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty: ReactNode;
}) {
  if (error) {
    return (
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )
        }
      >
        {errorMessage(error)}
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
      {events.map((e) => (
        <Grid key={e.id} size={gridSize}>
          <EventCard event={e} />
        </Grid>
      ))}
    </Grid>
  );
}
