import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import { eventsApi } from '../api/endpoints';
import { ApiError, errorMessage } from '../api/client';
import type { EventDetail, EventRequest } from '../api/types';
import { CATEGORY_OPTIONS } from '../lib/categories';
import { fromLocalInput, toLocalInput } from '../lib/format';
import { useAuth } from '../auth/useAuth';
import { useNotify } from '../notify/notify';
import { LocationPicker } from '../components/EventMap';
import { EventImage } from '../components/EventCard';

interface FormState {
  title: string;
  description: string;
  category: number;
  start: string;
  end: string;
  venueName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  price: string;
  capacity: string;
  imageUrl: string;
}

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(19, 0, 0, 0);
  return d;
}

const emptyForm = (): FormState => {
  const start = defaultStart();
  const end = new Date(start.getTime() + 3 * 3600_000);
  return {
    title: '',
    description: '',
    category: 0,
    start: toLocalInput(start.toISOString()),
    end: toLocalInput(end.toISOString()),
    venueName: '',
    address: '',
    latitude: null,
    longitude: null,
    price: '',
    capacity: '',
    imageUrl: '',
  };
};

const fromEvent = (e: EventDetail): FormState => ({
  title: e.title,
  description: e.description,
  category: e.category,
  start: toLocalInput(e.startUtc),
  end: toLocalInput(e.endUtc),
  venueName: e.venueName,
  address: e.address,
  latitude: e.latitude,
  longitude: e.longitude,
  price: e.price === null ? '' : String(e.price),
  capacity: e.capacity === null ? '' : String(e.capacity),
  imageUrl: e.imageUrl ?? '',
});

type Errors = Partial<Record<keyof FormState | 'startUtc' | 'endUtc', string>>;

function validate(f: FormState, isEdit: boolean): Errors {
  const e: Errors = {};
  if (!f.title.trim()) e.title = 'Title is required.';
  else if (f.title.length > 200) e.title = 'Max 200 characters.';
  if (!f.description.trim()) e.description = 'Description is required.';
  else if (f.description.length > 4000) e.description = 'Max 4000 characters.';
  if (!f.venueName.trim()) e.venueName = 'Venue is required.';
  if (!f.address.trim()) e.address = 'Address is required.';
  if (!f.start) e.start = 'Start is required.';
  else if (!isEdit && new Date(f.start).getTime() <= Date.now()) e.start = 'Start must be in the future.';
  if (!f.end) e.end = 'End is required.';
  else if (f.start && new Date(f.end) <= new Date(f.start)) e.end = 'End must be after start.';
  if (f.price !== '' && (Number.isNaN(Number(f.price)) || Number(f.price) < 0)) e.price = 'Price must be 0 or more.';
  if (f.capacity !== '' && (!Number.isInteger(Number(f.capacity)) || Number(f.capacity) <= 0))
    e.capacity = 'Capacity must be a whole number above 0.';
  if (f.imageUrl.length > 1000) e.imageUrl = 'Max 1000 characters.';
  return e;
}

function toRequest(f: FormState): EventRequest {
  return {
    title: f.title.trim(),
    description: f.description.trim(),
    category: f.category,
    startUtc: fromLocalInput(f.start),
    endUtc: fromLocalInput(f.end),
    venueName: f.venueName.trim(),
    address: f.address.trim(),
    latitude: f.latitude,
    longitude: f.longitude,
    price: f.price === '' ? null : Number(f.price),
    capacity: f.capacity === '' ? null : Number(f.capacity),
    imageUrl: f.imageUrl.trim() || null,
  };
}

export function EventFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const existing = useQuery({ queryKey: ['event', id], queryFn: () => eventsApi.get(id!), enabled: isEdit });

  if (!isEdit) return <EventForm />;

  if (existing.isLoading) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 900, mx: 'auto' }}>
        <Skeleton height={56} width="40%" />
        <Skeleton variant="rounded" height={480} />
      </Stack>
    );
  }
  if (existing.error || !existing.data) {
    return <Alert severity="error">{existing.error ? errorMessage(existing.error) : 'Event not found.'}</Alert>;
  }
  if (user && existing.data.organizerId !== user.id) return <Navigate to={`/events/${id}`} replace />;

  return <EventForm key={existing.data.id} event={existing.data} />;
}

function EventForm({ event }: { event?: EventDetail }) {
  const id = event?.id;
  const isEdit = !!event;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notify = useNotify();

  const [form, setForm] = useState<FormState>(() => (event ? fromEvent(event) : emptyForm()));
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const save = useMutation({
    mutationFn: (req: EventRequest) => (isEdit ? eventsApi.update(id!, req) : eventsApi.create(req)),
    onSuccess: (saved) => {
      queryClient.setQueryData(['event', saved.id], saved);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      notify(isEdit ? 'Event updated' : 'Event created');
      navigate(`/events/${saved.id}`, { replace: isEdit });
    },
    onError: (err) => {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        const mapped: Errors = {};
        for (const [k, v] of Object.entries(err.fieldErrors)) {
          const key = k === 'startUtc' ? 'start' : k === 'endUtc' ? 'end' : k;
          mapped[key as keyof Errors] = v.join(' ');
        }
        setErrors(mapped);
      }
      setSubmitError(errorMessage(err));
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const errs = validate(form, isEdit);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setSubmitError('Please fix the highlighted fields.');
      return;
    }
    save.mutate(toRequest(form));
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEdit ? 'Edit event' : 'Create an event'}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {isEdit ? 'Update the details below. Attendees see changes right away.' : 'Share something happening in Timișoara.'}
      </Typography>

      <Stack component="form" spacing={3} onSubmit={submit} noValidate>
        {submitError && <Alert severity="error">{submitError}</Alert>}

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Basics
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  label="Title"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  error={!!errors.title}
                  helperText={errors.title}
                  required
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 200 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  id="event-category"
                  label="Category"
                  value={form.category}
                  onChange={(e) => set('category', Number(e.target.value))}
                  fullWidth
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', '& svg': { fontSize: 18 } }}>
                        {c.icon}
                        <span>{c.label}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Description"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  error={!!errors.description}
                  helperText={errors.description ?? `${form.description.length}/4000`}
                  required
                  fullWidth
                  multiline
                  minRows={5}
                  slotProps={{ htmlInput: { maxLength: 4000 } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              When
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Starts"
                  type="datetime-local"
                  value={form.start}
                  onChange={(e) => set('start', e.target.value)}
                  error={!!errors.start}
                  helperText={errors.start}
                  required
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Ends"
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) => set('end', e.target.value)}
                  error={!!errors.end}
                  helperText={errors.end}
                  required
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: form.start || undefined } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Where
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Venue"
                  value={form.venueName}
                  onChange={(e) => set('venueName', e.target.value)}
                  error={!!errors.venueName}
                  helperText={errors.venueName}
                  required
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 200 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Address"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  error={!!errors.address}
                  helperText={errors.address}
                  required
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 300 } }}
                />
              </Grid>
              <Grid size={12}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {form.latitude !== null && form.longitude !== null
                      ? `Pin: ${form.latitude}, ${form.longitude}. Drag it or click elsewhere to move.`
                      : 'Optional: click the map to pin the exact location.'}
                  </Typography>
                  {form.latitude !== null && (
                    <Button
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={() => setForm((f) => ({ ...f, latitude: null, longitude: null }))}
                    >
                      Clear pin
                    </Button>
                  )}
                </Stack>
                <LocationPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tickets & extras
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Price"
                  type="number"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  error={!!errors.price}
                  helperText={errors.price ?? 'Leave empty if unknown, 0 for free.'}
                  fullWidth
                  slotProps={{
                    htmlInput: { min: 0, step: '0.01' },
                    input: { endAdornment: <InputAdornment position="end">RON</InputAdornment> },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Capacity"
                  type="number"
                  value={form.capacity}
                  onChange={(e) => set('capacity', e.target.value)}
                  error={!!errors.capacity}
                  helperText={errors.capacity ?? 'Leave empty for unlimited.'}
                  fullWidth
                  slotProps={{ htmlInput: { min: 1, step: 1 } }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Image URL"
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => set('imageUrl', e.target.value)}
                  error={!!errors.imageUrl}
                  helperText={errors.imageUrl ?? 'Optional. A cover image shown on the event card.'}
                  placeholder="https://…"
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Card preview
                </Typography>
                <Card sx={{ mt: 0.5 }}>
                  <EventImage imageUrl={form.imageUrl.trim() || null} category={form.category} height={140} alt="Preview" />
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate(-1)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" size="large" startIcon={<SaveIcon />} loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Publish event'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
