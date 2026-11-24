import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@mui/material';
import { EmptyState } from '../components/EventGrid';

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you're looking for doesn't exist or was moved."
      action={
        <Button variant="contained" component={RouterLink} to="/">
          Back to events
        </Button>
      }
    />
  );
}
