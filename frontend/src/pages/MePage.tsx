import { Link as RouterLink, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Stack, Tab, Tabs, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExploreIcon from '@mui/icons-material/Explore';
import { eventsApi } from '../api/endpoints';
import { EmptyState, EventGrid } from '../components/EventGrid';

const tabs = {
  events: {
    label: 'My events',
    fetch: eventsApi.mine,
    emptyTitle: "You haven't organized any events yet",
    emptyText: 'Create an event and it will show up here.',
    action: (
      <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/events/new">
        Create event
      </Button>
    ),
  },
  attending: {
    label: 'Attending',
    fetch: eventsApi.attending,
    emptyTitle: 'No upcoming plans',
    emptyText: 'Events you mark as Going or Interested will appear here.',
    action: (
      <Button variant="contained" startIcon={<ExploreIcon />} component={RouterLink} to="/">
        Discover events
      </Button>
    ),
  },
  favorites: {
    label: 'Favorites',
    fetch: eventsApi.favorites,
    emptyTitle: 'No favorites yet',
    emptyText: 'Tap the heart on an event to save it for later.',
    action: (
      <Button variant="contained" startIcon={<ExploreIcon />} component={RouterLink} to="/">
        Discover events
      </Button>
    ),
  },
} as const;

type TabKey = keyof typeof tabs;

export function MePage() {
  const { tab } = useParams();
  if (!tab || !(tab in tabs)) return <Navigate to="/me/events" replace />;
  return <MeTabs tab={tab as TabKey} />;
}

function MeTabs({ tab }: { tab: TabKey }) {
  const config = tabs[tab];
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['me', tab],
    queryFn: () => config.fetch(),
  });

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1">
          Your events
        </Typography>
        <Button variant="outlined" startIcon={<AddIcon />} component={RouterLink} to="/events/new">
          New event
        </Button>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} variant="scrollable" allowScrollButtonsMobile>
          {(Object.keys(tabs) as TabKey[]).map((key) => (
            <Tab
              key={key}
              value={key}
              component={RouterLink}
              to={`/me/${key}`}
              label={key === tab && data ? `${tabs[key].label} (${data.length})` : tabs[key].label}
            />
          ))}
        </Tabs>
      </Box>

      <EventGrid
        events={data}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        empty={<EmptyState title={config.emptyTitle} description={config.emptyText} action={config.action} />}
      />
    </Stack>
  );
}
