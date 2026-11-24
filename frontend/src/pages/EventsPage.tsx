import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Chip,
  Collapse,
  InputAdornment,
  Pagination,
  Paper,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
  FormControlLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import { eventsApi } from '../api/endpoints';
import type { EventQuery } from '../api/types';
import { CATEGORY_OPTIONS } from '../lib/categories';
import { dateInputToIso } from '../lib/format';
import { EmptyState, EventGrid } from '../components/EventGrid';
import { TIMISOARA } from '../lib/geo';
import { useAuth } from '../auth/useAuth';

const PAGE_SIZE = 12;

export function EventsPage() {
  const { isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();

  const search = params.get('q') ?? '';
  const category = params.get('category');
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const near = params.get('near') === '1';
  const radius = Number(params.get('radius') ?? 5);
  const lat = params.get('lat');
  const lng = params.get('lng');
  const page = Math.max(1, Number(params.get('page') ?? 1));

  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(!!(from || to || near));
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const update = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  // Keep the box in sync when the URL changes from elsewhere (Discover link, Reset, back button).
  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    if (search !== searchInput.trim()) setSearchInput(search);
  }

  // Search as you type: push the text into the URL shortly after the last keystroke.
  useEffect(() => {
    if (searchInput.trim() === search) return;
    const t = window.setTimeout(() => update({ q: searchInput.trim() || null }), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const query: EventQuery = useMemo(() => {
    const q: EventQuery = { page, pageSize: PAGE_SIZE };
    if (search) q.search = search;
    if (category !== null) q.category = Number(category);
    if (from) q.from = dateInputToIso(from);
    if (to) q.to = dateInputToIso(to, true);
    if (near) {
      q.latitude = lat ? Number(lat) : TIMISOARA[0];
      q.longitude = lng ? Number(lng) : TIMISOARA[1];
      q.radiusKm = radius;
    }
    return q;
  }, [page, search, category, from, to, near, lat, lng, radius]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['events', query],
    queryFn: () => eventsApi.list(query),
    placeholderData: keepPreviousData,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const hasFilters = !!(search || category !== null || from || to || near);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Location is not available in this browser. Using Timișoara centre.');
      update({ near: '1' });
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        update({ near: '1', lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) });
      },
      () => {
        setLocating(false);
        setGeoError("Couldn't get your location. Using Timișoara centre instead.");
        update({ near: '1', lat: null, lng: null });
      },
      { timeout: 8000 },
    );
  };

  return (
    <Stack spacing={3}>
      <Paper
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          color: 'common.white',
          background: 'linear-gradient(120deg, #3d5afe 0%, #7c4dff 50%, #f50057 100%)',
        }}
        elevation={0}
      >
        <Typography variant="h3" sx={{ fontSize: { xs: 30, md: 44 } }} gutterBottom>
          What's happening in Timișoara?
        </Typography>
        <Typography sx={{ opacity: 0.9, mb: 3, maxWidth: 560 }}>
          Concerts, food festivals, meetups and more. Find something to do, RSVP, and keep your favorites in one place.
        </Typography>
        <TextField
          fullWidth
          placeholder="Search events, venues…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ maxWidth: 640, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 3 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <Button size="small" onClick={() => setSearchInput('')} aria-label="Clear search">
                    <ClearIcon fontSize="small" />
                  </Button>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
      </Paper>

      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              flexGrow: 1,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Chip
              label="All"
              color={category === null ? 'primary' : 'default'}
              variant={category === null ? 'filled' : 'outlined'}
              onClick={() => update({ category: null })}
            />
            {CATEGORY_OPTIONS.map((c) => {
              const active = category === String(c.value);
              return (
                <Chip
                  key={c.value}
                  icon={c.icon}
                  label={c.label}
                  color={active ? 'primary' : 'default'}
                  variant={active ? 'filled' : 'outlined'}
                  onClick={() => update({ category: active ? null : String(c.value) })}
                />
              );
            })}
          </Box>
          <Button
            startIcon={<TuneIcon />}
            variant={showFilters ? 'contained' : 'outlined'}
            onClick={() => setShowFilters((s) => !s)}
            sx={{ flexShrink: 0 }}
          >
            Filters
          </Button>
        </Stack>

        <Collapse in={showFilters}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
              <TextField
                label="From"
                type="date"
                size="small"
                value={from}
                onChange={(e) => update({ from: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="To"
                type="date"
                size="small"
                value={to}
                onChange={(e) => update({ to: e.target.value })}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: from || undefined } }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={near}
                    onChange={(e) => (e.target.checked ? update({ near: '1' }) : update({ near: null, lat: null, lng: null }))}
                  />
                }
                label="Near"
              />
              <Box sx={{ flexGrow: 1, minWidth: 160, px: 1, opacity: near ? 1 : 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Within {radius} km of {lat ? 'you' : 'Timișoara centre'}
                </Typography>
                <Slider
                  size="small"
                  value={radius}
                  min={1}
                  max={50}
                  disabled={!near}
                  valueLabelDisplay="auto"
                  onChange={(_, v) => update({ radius: String(v) })}
                />
              </Box>
              <Button startIcon={<MyLocationIcon />} onClick={useMyLocation} loading={locating}>
                Use my location
              </Button>
              {hasFilters && (
                <Button
                  color="inherit"
                  onClick={() => {
                    setSearchInput('');
                    setParams(new URLSearchParams(), { replace: true });
                  }}
                >
                  Reset
                </Button>
              )}
            </Stack>
            {geoError && (
              <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
                {geoError}
              </Typography>
            )}
          </Paper>
        </Collapse>
      </Stack>

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography variant="h5">{hasFilters ? 'Results' : 'Upcoming events'}</Typography>
        {data && (
          <Typography variant="body2" color="text.secondary">
            {data.total} event{data.total === 1 ? '' : 's'}
            {isFetching && !isLoading ? ' · updating…' : ''}
          </Typography>
        )}
      </Stack>

      <EventGrid
        events={data?.items}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        empty={
          <EmptyState
            title={hasFilters ? 'No events match your filters' : 'No upcoming events yet'}
            description={hasFilters ? 'Try a different category, date range or a bigger radius.' : 'Be the first to organize one.'}
            action={
              isAuthenticated && (
                <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/events/new">
                  Create event
                </Button>
              )
            }
          />
        }
      />

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={(_, p) => {
              update({ page: p === 1 ? null : String(p) }, false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </Box>
      )}
    </Stack>
  );
}
