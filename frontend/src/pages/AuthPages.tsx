import { useState, type FormEvent, type ReactNode } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, IconButton, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { ApiError, errorMessage } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { useNotify } from '../notify/notify';
import { useI18n } from '../i18n/i18n';
import type { MessageKey } from '../i18n/messages';
import { validateRegister, type RegisterField } from '../lib/registerForm';

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
  const { t } = useI18n();
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
              <IconButton
                onClick={() => setShow((s) => !s)}
                edge="end"
                aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
              >
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
  const { t } = useI18n();
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
      notify(t('auth.welcomeBack'));
      navigate(target, { replace: true });
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title={t('auth.signInTitle')} subtitle={t('auth.signInSubtitle')}>
      <Stack component="form" spacing={2} onSubmit={submit} noValidate>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          fullWidth
          autoFocus
        />
        <PasswordField label={t('auth.password')} value={password} onChange={setPassword} autoComplete="current-password" />
        <Button type="submit" variant="contained" size="large" loading={loading} disabled={!email || !password}>
          {t('auth.signInButton')}
        </Button>
        <Typography variant="body2" align="center">
          {t('auth.newHere')}{' '}
          <Link component={RouterLink} to="/register" state={{ from: target }}>
            {t('auth.createAccountLink')}
          </Link>
        </Typography>
      </Stack>
    </AuthCard>
  );
}

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const notify = useNotify();
  const target = useRedirectTarget();
  const [values, setValues] = useState<Record<RegisterField, string>>({ displayName: '', email: '', password: '', confirm: '' });
  const [clientErrors, setClientErrors] = useState<Partial<Record<RegisterField, MessageKey>>>({});
  const [serverErrors, setServerErrors] = useState<Partial<Record<RegisterField, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && !loading) return <Navigate to={target} replace />;

  const set = (field: RegisterField) => (value: string) => setValues((v) => ({ ...v, [field]: value }));
  const fieldError = (field: RegisterField) =>
    clientErrors[field] ? t(clientErrors[field]!) : serverErrors[field];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setServerErrors({});
    const errs = validateRegister(values);
    setClientErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await register({ displayName: values.displayName.trim(), email: values.email.trim(), password: values.password });
      notify(t('auth.registered'));
      navigate(target, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        setServerErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, v.join(' ')])));
      }
      setError(errorMessage(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      <Stack component="form" spacing={2} onSubmit={submit} noValidate>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label={t('auth.displayName')}
          value={values.displayName}
          onChange={(e) => set('displayName')(e.target.value)}
          error={!!fieldError('displayName')}
          helperText={fieldError('displayName')}
          autoComplete="name"
          required
          fullWidth
          autoFocus
        />
        <TextField
          label={t('auth.email')}
          type="email"
          value={values.email}
          onChange={(e) => set('email')(e.target.value)}
          error={!!fieldError('email')}
          helperText={fieldError('email')}
          autoComplete="email"
          required
          fullWidth
        />
        <PasswordField
          label={t('auth.password')}
          value={values.password}
          onChange={set('password')}
          error={fieldError('password')}
          helperText={t('auth.passwordHelp')}
          autoComplete="new-password"
        />
        <PasswordField
          label={t('auth.confirmPassword')}
          value={values.confirm}
          onChange={set('confirm')}
          error={fieldError('confirm')}
          autoComplete="new-password"
        />
        <Button type="submit" variant="contained" size="large" loading={loading}>
          {t('auth.registerButton')}
        </Button>
        <Typography variant="body2" align="center">
          {t('auth.haveAccount')}{' '}
          <Link component={RouterLink} to="/login" state={{ from: target }}>
            {t('auth.signInLink')}
          </Link>
        </Typography>
      </Stack>
    </AuthCard>
  );
}
