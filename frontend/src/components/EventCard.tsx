import { Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, CardMedia, Chip, Stack, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleIcon from '@mui/icons-material/People';
import type { EventSummary } from '../api/types';
import { categoryMeta } from '../lib/categories';
import { formatPrice, formatShortDate } from '../lib/format';

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

export function EventCard({ event }: { event: EventSummary }) {
  const meta = categoryMeta(event.category);
  const price = formatPrice(event.price);

  return (
    <Card sx={{ height: '100%', transition: 'transform .15s, box-shadow .15s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
      <CardActionArea component={RouterLink} to={`/events/${event.id}`} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <Box sx={{ position: 'relative' }}>
          <EventImage imageUrl={event.imageUrl} category={event.category} height={160} alt={event.title} />
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 10, left: 10 }}>
            <Chip size="small" icon={meta.icon} label={meta.label} sx={{ bgcolor: 'background.paper', '& .MuiChip-icon': { fontSize: 16 } }} />
          </Stack>
          {price && (
            <Chip
              size="small"
              label={price}
              color={event.price === 0 ? 'success' : 'default'}
              sx={{ position: 'absolute', top: 10, right: 10, bgcolor: event.price === 0 ? undefined : 'background.paper', fontWeight: 600 }}
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
              <Typography variant="body2">{formatShortDate(event.startUtc)}</Typography>
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
                <Typography variant="body2">{event.goingCount} going</Typography>
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
