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
import { useI18n } from '../i18n/i18n';
import type { MessageKey } from '../i18n/messages';
import { categoryMeta } from '../lib/categories';
import { formatPrice, formatRange, initials } from '../lib/format';
import { EventImage } from '../components/EventCard';
import { EventMap } from '../components/EventMap';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AddToCalendar } from '../components/AddToCalendar';
import { isFree } from '../lib/eventFilters';

const rsvpStatusKey: Record<RsvpStatus, MessageKey> = {
  [RsvpStatus.Going]: 'event.rsvpStatus.going',
  [RsvpStatus.Interested]: 'event.rsvpStatus.interested',
  [RsvpStatus.NotGoing]: 'event.rsvpStatus.notGoing',
};

export function EventDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { t, locale } = useI18n();
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

  const requireLogin = () => navigate('/login', { state: { from: location.pathname } });

  const rsvp = useMutation({
    mutationFn: async (status: RsvpStatus | null) => {
      if (status === null) await eventsApi.removeRsvp(id);
      else await eventsApi.rsvp(id, status);
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      invalidateLists();
      notify(status === null ? t('event.rsvpRemoved') : t(rsvpStatusKey[status]));
    },
    onError: (err) => notify(errorMessage(err, t), 'error'),
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
      notify(errorMessage(err, t), 'error');
    },
    onSuccess: (fav) => {
      queryClient.invalidateQueries({ queryKey: ['me', 'favorites'] });
      notify(fav ? t('event.favorited') : t('event.unfavorited'));
    },
  });

  const remove = useMutation({
    mutationFn: () => eventsApi.remove(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['event', id] });
      invalidateLists();
      notify(t('event.deleted'));
      navigate('/me/events', { replace: true });
    },
    onError: (err) => {
      setConfirmDelete(false);
      notify(errorMessage(err, t), 'error');
    },
  });

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: event?.title, url });
      else {
        await navigator.clipboard.writeText(url);
        notify(t('event.linkCopied'), 'info');
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
            {t('common.backToEvents')}
          </Button>
        }
      >
        {error ? errorMessage(error, t) : t('event.notFound')}
      </Alert>
    );
  }

  const meta = categoryMeta(event.category);
  const price = formatPrice(event.price, locale, t('common.free'), isFree(event));
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
          {t('common.back')}
        </Button>
      </Box>

      <Card sx={{ overflow: 'hidden' }}>
        <EventImage imageUrl={event.imageUrl} category={event.category} height={320} alt={event.title} />
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip icon={meta.icon} label={t(meta.labelKey)} color="primary" variant="outlined" />
              {event.externalSource && <Chip label={t('event.via', { source: event.externalSource })} variant="outlined" />}
              {isPast && <Chip label={t('event.ended')} />}
              {isOwner && <Chip label={t('event.youOrganize')} color="secondary" variant="outlined" />}
            </Stack>

            <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontSize: { xs: 28, md: 36 } }}>
                {event.title}
              </Typography>
              <Tooltip title={event.isFavorite ? t('event.removeFavorite') : t('event.addFavorite')}>
                <IconButton
                  color="secondary"
                  onClick={() => (isAuthenticated ? favorite.mutate(!event.isFavorite) : requireLogin())}
                  aria-label={event.isFavorite ? t('event.removeFavorite') : t('event.addFavorite')}
                >
                  {event.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title={t('event.share')}>
                <IconButton onClick={share} aria-label={t('event.share')}>
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
                  {t('event.location')}
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
                    <Typography variant="body2">{formatRange(event.startUtc, event.endUtc, locale)}</Typography>
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
                        {t('event.directions')}
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

                  {!isPast && <AddToCalendar event={event} />}

                  <Divider />

                  <Stack direction="row" spacing={3}>
                    <Box>
                      <Typography variant="h5">{event.goingCount}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('event.going')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5">{event.interestedCount}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('event.interested')}
                      </Typography>
                    </Box>
                    {event.capacity !== null && (
                      <Box>
                        <Typography variant="h5">{Math.max(0, event.capacity - event.goingCount)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('event.spotsLeft')}
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
                      <Typography variant="subtitle2">{t('event.areYouGoing')}</Typography>
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
                          <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('event.rsvp.going')}
                        </ToggleButton>
                        <ToggleButton value={RsvpStatus.Interested}>
                          <StarIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('event.rsvp.interested')}
                        </ToggleButton>
                        <ToggleButton value={RsvpStatus.NotGoing}>
                          <DoNotDisturbIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('event.rsvp.no')}
                        </ToggleButton>
                      </ToggleButtonGroup>
                      {isFull && (
                        <Typography variant="caption" color="error">
                          {t('event.full')}
                        </Typography>
                      )}
                      {event.myRsvpStatus !== null && (
                        <Typography variant="caption" color="text.secondary">
                          {t('event.rsvpHint', { status: t(rsvpStatusKey[event.myRsvpStatus]) })}
                        </Typography>
                      )}
                      {!isAuthenticated && (
                        <Typography variant="caption" color="text.secondary">
                          <RouterLink to="/login" state={{ from: location.pathname }}>
                            {t('nav.signIn')}
                          </RouterLink>{' '}
                          {t('event.signInToRsvp')}
                        </Typography>
                      )}
                    </>
                  )}

                  {event.externalUrl && (
                    <Button variant="contained" endIcon={<OpenInNewIcon />} href={event.externalUrl} target="_blank" rel="noopener">
                      {t('event.tickets')}
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
                        {t('event.organizedBy')}
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
                  {t('event.edit')}
                </Button>
                <Button fullWidth variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(true)}>
                  {t('event.delete')}
                </Button>
              </Stack>
            )}
          </Stack>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirmDelete}
        title={t('event.deleteTitle')}
        message={t('event.deleteText', { title: event.title })}
        confirmLabel={t('event.delete')}
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onClose={() => setConfirmDelete(false)}
      />
    </Stack>
  );
}
