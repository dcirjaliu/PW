import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceIcon from '@mui/icons-material/Place';
import SellIcon from '@mui/icons-material/Sell';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import { eventsApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { RsvpStatus, type EventDetail } from '../api/types';
import { useAuth } from '../auth/useAuth';
import { useNotify } from '../notify/notify';
import { categoryMeta } from '../lib/categories';
import { formatPrice, formatRange, initials } from '../lib/format';
import { EventImage } from '../components/EventCard';
import { EventMap } from '../components/EventMap';
import { ConfirmDialog } from '../components/ConfirmDialog';

const rsvpLabels: Record<RsvpStatus, string> = {
  [RsvpStatus.Going]: "You're going",
  [RsvpStatus.Interested]: "You're interested",
  [RsvpStatus.NotGoing]: "You're not going",
};

export function EventDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { user, isAuthenticated } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [now] = useState(() => Date.now());

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id),
    enabled: !!id,
  });

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  const requireLogin = () => {
    navigate('/login', { state: { from: location.pathname } });
  };

  const rsvp = useMutation({
    mutationFn: async (status: RsvpStatus | null) => {
      if (status === null) await eventsApi.removeRsvp(id);
      else await eventsApi.rsvp(id, status);
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      invalidateLists();
      notify(status === null ? 'RSVP removed' : rsvpLabels[status]);
    },
    onError: (err) => notify(errorMessage(err), 'error'),
  });

  const favorite = useMutation({
    mutationFn: async (fav: boolean) => {
      if (fav) await eventsApi.favorite(id);
      else await eventsApi.unfavorite(id);
      return fav;
    },
    onMutate: async (fav) => {
      await queryClient.cancelQueries({ queryKey: ['event', id] });
      const prev = queryClient.getQueryData<EventDetail>(['event', id]);
      if (prev) queryClient.setQueryData<EventDetail>(['event', id], { ...prev, isFavorite: fav });
      return { prev };
    },
    onError: (err, _fav, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['event', id], ctx.prev);
      notify(errorMessage(err), 'error');
    },
    onSuccess: (fav) => {
      queryClient.invalidateQueries({ queryKey: ['me', 'favorites'] });
      notify(fav ? 'Added to favorites' : 'Removed from favorites');
    },
  });

  const remove = useMutation({
    mutationFn: () => eventsApi.remove(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['event', id] });
      invalidateLists();
      notify('Event deleted');
      navigate('/me/events', { replace: true });
    },
    onError: (err) => {
      setConfirmDelete(false);
      notify(errorMessage(err), 'error');
    },
  });

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: event?.title, url });
      else {
        await navigator.clipboard.writeText(url);
        notify('Link copied to clipboard', 'info');
      }
    } catch {
      // user cancelled the share sheet
    }
  };

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={320} />
        <Skeleton width="60%" height={48} />
        <Skeleton width="40%" />
        <Skeleton variant="rounded" height={160} />
      </Stack>
    );
  }

  if (error || !event) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" component={RouterLink} to="/">
            Back to events
          </Button>
        }
      >
        {error ? errorMessage(error) : 'Event not found.'}
      </Alert>
    );
  }

  const meta = categoryMeta(event.category);
  const price = formatPrice(event.price);
  const isOwner = !!user && user.id === event.organizerId;
  const isPast = new Date(event.endUtc).getTime() < now;
  const isFull = event.capacity !== null && event.goingCount >= event.capacity && event.myRsvpStatus !== RsvpStatus.Going;
  const hasLocation = event.latitude !== null && event.longitude !== null;
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName}, ${event.address}`)}`;

  const onRsvpChange = (_: unknown, value: RsvpStatus | null) => {
    if (!isAuthenticated) return requireLogin();
    rsvp.mutate(value);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}>
          Back
        </Button>
      </Box>

      <Card sx={{ overflow: 'hidden' }}>
        <EventImage imageUrl={event.imageUrl} category={event.category} height={320} alt={event.title} />
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip icon={meta.icon} label={meta.label} color="primary" variant="outlined" />
              {event.externalSource && <Chip label={`via ${event.externalSource}`} variant="outlined" />}
              {isPast && <Chip label="Ended" color="default" />}
              {isOwner && <Chip label="You're the organizer" color="secondary" variant="outlined" />}
            </Stack>

            <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontSize: { xs: 28, md: 36 } }}>
                {event.title}
              </Typography>
              <Tooltip title={event.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton
                  color="secondary"
                  onClick={() => (isAuthenticated ? favorite.mutate(!event.isFavorite) : requireLogin())}
                  aria-label="Toggle favorite"
                >
                  {event.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton onClick={share} aria-label="Share">
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
              {event.description}
            </Typography>

            {hasLocation && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Location
                </Typography>
                <EventMap latitude={event.latitude!} longitude={event.longitude!} />
              </Box>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2} sx={{ position: { md: 'sticky' }, top: { md: 88 } }}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5}>
                    <AccessTimeIcon color="action" />
                    <Typography variant="body2">{formatRange(event.startUtc, event.endUtc)}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5}>
                    <PlaceIcon color="action" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {event.venueName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.address}
                      </Typography>
                      <Button size="small" href={mapsUrl} target="_blank" rel="noopener" sx={{ px: 0 }}>
                        Get directions
                      </Button>
                    </Box>
                  </Stack>
                  {price && (
                    <Stack direction="row" spacing={1.5}>
                      <SellIcon color="action" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {price}
                      </Typography>
                    </Stack>
                  )}

                  <Divider />

                  <Stack direction="row" spacing={3}>
                    <Box>
                      <Typography variant="h5">{event.goingCount}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        going
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5">{event.interestedCount}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        interested
                      </Typography>
                    </Box>
                    {event.capacity !== null && (
                      <Box>
                        <Typography variant="h5">{Math.max(0, event.capacity - event.goingCount)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          spots left
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  {event.capacity !== null && (
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (event.goingCount / event.capacity) * 100)}
                      color={event.goingCount >= event.capacity ? 'error' : 'primary'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  )}

                  {!isPast && (
                    <>
                      <Divider />
                      <Typography variant="subtitle2">Are you going?</Typography>
                      <ToggleButtonGroup
                        exclusive
                        fullWidth
                        size="small"
                        color="primary"
                        value={event.myRsvpStatus}
                        onChange={onRsvpChange}
                        disabled={rsvp.isPending}
                      >
                        <ToggleButton value={RsvpStatus.Going} disabled={isFull}>
                          <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} /> Going
                        </ToggleButton>
                        <ToggleButton value={RsvpStatus.Interested}>
                          <StarIcon fontSize="small" sx={{ mr: 0.5 }} /> Interested
                        </ToggleButton>
                        <ToggleButton value={RsvpStatus.NotGoing}>
                          <DoNotDisturbIcon fontSize="small" sx={{ mr: 0.5 }} /> No
                        </ToggleButton>
                      </ToggleButtonGroup>
                      {isFull && (
                        <Typography variant="caption" color="error">
                          This event is at full capacity.
                        </Typography>
                      )}
                      {event.myRsvpStatus !== null && (
                        <Typography variant="caption" color="text.secondary">
                          {rsvpLabels[event.myRsvpStatus]}. Click your answer again to remove it.
                        </Typography>
                      )}
                      {!isAuthenticated && (
                        <Typography variant="caption" color="text.secondary">
                          <RouterLink to="/login" state={{ from: location.pathname }}>
                            Sign in
                          </RouterLink>{' '}
                          to RSVP or save this event.
                        </Typography>
                      )}
                    </>
                  )}

                  {event.externalUrl && (
                    <Button variant="contained" endIcon={<OpenInNewIcon />} href={event.externalUrl} target="_blank" rel="noopener">
                      Get tickets
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {event.organizerName && (
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>{initials(event.organizerName)}</Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Organized by
                      </Typography>
                      <Typography variant="subtitle2">{event.organizerName}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {isOwner && (
              <Stack direction="row" spacing={1}>
                <Button fullWidth variant="outlined" startIcon={<EditIcon />} component={RouterLink} to={`/events/${event.id}/edit`}>
                  Edit
                </Button>
                <Button fullWidth variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              </Stack>
            )}
          </Stack>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this event?"
        message={`"${event.title}" and all its RSVPs will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onClose={() => setConfirmDelete(false)}
      />
    </Stack>
  );
}
