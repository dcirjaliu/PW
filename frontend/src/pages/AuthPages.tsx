import { useState, type FormEvent, type ReactNode } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, IconButton, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { ApiError, errorMessage } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { useNotify } from '../notify/notify';

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: { xs: 2, md: 6 } }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
            <CelebrationIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h5">{title}</Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {subtitle}
            </Typography>
          </Stack>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}

function PasswordField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  helperText?: string;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      label={props.label}
      type={show ? 'text' : 'password'}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      error={!!props.error}
      helperText={props.error ?? props.helperText}
      autoComplete={props.autoComplete}
      required
      fullWidth
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShow((s) => !s)} edge="end" aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

function useRedirectTarget() {
  const location = useLocation();
  return (location.state as { from?: string } | null)?.from ?? '/';
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const target = useRedirectTarget();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && !loading) return <Navigate to={target} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      notify('Welcome back!');
      navigate(target, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Sign in" subtitle="RSVP to events, save favorites and organize your own.">
      <Stack component="form" spacing={2} onSubmit={submit} noValidate>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          fullWidth
          autoFocus
        />
        <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <Button type="submit" variant="contained" size="large" loading={loading} disabled={!email || !password}>
          Sign in
        </Button>
        <Typography variant="body2" align="center">
          New to Gatherly?{' '}
          <Link component={RouterLink} to="/register" state={{ from: target }}>
            Create an account
          </Link>
        </Typography>
      </Stack>
    </AuthCard>
  );
}

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const target = useRedirectTarget();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && !loading) return <Navigate to={target} replace />;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = 'Tell us your name.';
    else if (displayName.length > 100) errs.displayName = 'Max 100 characters.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Enter a valid email.';
    if (password.length < 8) errs.password = 'At least 8 characters.';
    if (confirm !== password) errs.confirm = "Passwords don't match.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ displayName: displayName.trim(), email: email.trim(), password });
      notify('Account created. Welcome to Gatherly!');
      navigate(target, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        setFieldErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, v.join(' ')])));
      }
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Create your account" subtitle="Join Gatherly to discover and organize local events.">
      <Stack component="form" spacing={2} onSubmit={submit} noValidate>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={!!fieldErrors.displayName}
          helperText={fieldErrors.displayName}
          autoComplete="name"
          required
          fullWidth
          autoFocus
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!fieldErrors.email}
          helperText={fieldErrors.email}
          autoComplete="email"
          required
          fullWidth
        />
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          helperText="At least 8 characters, with a digit, an uppercase and a lowercase letter."
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          error={fieldErrors.confirm}
          autoComplete="new-password"
        />
        <Button type="submit" variant="contained" size="large" loading={loading}>
          Create account
        </Button>
        <Typography variant="body2" align="center">
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" state={{ from: target }}>
            Sign in
          </Link>
        </Typography>
      </Stack>
    </AuthCard>
  );
}
