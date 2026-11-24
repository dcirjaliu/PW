import { Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, CardMedia, Chip, Stack, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleIcon from '@mui/icons-material/People';
import type { EventSummary } from '../api/types';
import { categoryMeta } from '../lib/categories';
import { formatPrice, formatShortDate } from '../lib/format';
import { useI18n } from '../i18n/i18n';
import { isFree } from '../lib/eventFilters';

export function EventImage({
  imageUrl,
  category,
  height,
  alt,
}: {
  imageUrl: string | null;
  category: number;
  height: number | string;
  alt: string;
}) {
  const meta = categoryMeta(category);
  if (imageUrl) {
    return <CardMedia component="img" image={imageUrl} alt={alt} sx={{ height, objectFit: 'cover' }} />;
  }
  return (
    <Box
      aria-hidden
      sx={{
        height,
        display: 'grid',
        placeItems: 'center',
        color: 'common.white',
        background: `linear-gradient(135deg, ${meta.gradient[0]}, ${meta.gradient[1]})`,
        '& svg': { fontSize: 56, opacity: 0.9 },
      }}
    >
      {meta.icon}
    </Box>
  );
}

export function EventCard({ event, dimmed }: { event: EventSummary; dimmed?: boolean }) {
  const { t, locale } = useI18n();
  const meta = categoryMeta(event.category);
  const free = isFree(event);
  const price = formatPrice(event.price, locale, t('common.free'), free);

  return (
    <Card
      sx={{
        height: '100%',
        opacity: dimmed ? 0.7 : 1,
        transition: 'transform .15s, box-shadow .15s, opacity .15s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 4, opacity: 1 },
      }}
    >
      <CardActionArea
        component={RouterLink}
        to={`/events/${event.id}`}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box sx={{ position: 'relative' }}>
          <EventImage imageUrl={event.imageUrl} category={event.category} height={160} alt={event.title} />
          <Chip
            size="small"
            icon={meta.icon}
            label={t(meta.labelKey)}
            sx={{ position: 'absolute', top: 10, left: 10, bgcolor: 'background.paper', '& .MuiChip-icon': { fontSize: 16 } }}
          />
          {price && (
            <Chip
              size="small"
              label={price}
              color={free ? 'success' : 'default'}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                bgcolor: free ? undefined : 'background.paper',
                fontWeight: 600,
              }}
            />
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }} className="clamp-2">
            {event.title}
          </Typography>
          <Stack spacing={0.5} sx={{ color: 'text.secondary', mt: 'auto' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <AccessTimeIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">{formatShortDate(event.startUtc, locale)}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <PlaceIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" noWrap>
                {event.venueName}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <PeopleIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">{t('card.going', { count: event.goingCount })}</Typography>
              </Stack>
              {event.externalSource && (
                <Chip size="small" variant="outlined" label={event.externalSource} sx={{ height: 20, fontSize: 11 }} />
              )}
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
