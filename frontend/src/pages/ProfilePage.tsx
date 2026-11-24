import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, Avatar, Box, Button, Card, CardContent, Skeleton, Stack, TextField, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { usersApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import type { UserProfile } from '../api/types';
import { useAuth } from '../auth/useAuth';
import { useNotify } from '../notify/notify';
import { initials } from '../lib/format';

export function ProfilePage() {
  const { data: profile, isLoading, error } = useQuery({ queryKey: ['me', 'profile'], queryFn: usersApi.me });

  if (error) return <Alert severity="error">{errorMessage(error)}</Alert>;

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          {isLoading || !profile ? (
            <Stack spacing={2}>
              <Skeleton variant="circular" width={96} height={96} />
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={120} />
            </Stack>
          ) : (
            <ProfileForm key={profile.id} profile={profile} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function ProfileForm({ profile: initial }: { profile: UserProfile }) {
  const { setUser } = useAuth();
  const notify = useNotify();
  const [profile, setProfile] = useState(initial);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? '');

  const save = useMutation({
    mutationFn: () => usersApi.updateMe({ displayName: displayName.trim(), bio: bio.trim(), avatarUrl: avatarUrl.trim() }),
    onSuccess: (updated) => {
      setUser(updated);
      setProfile(updated);
      notify('Profile updated');
    },
    onError: (err) => notify(errorMessage(err), 'error'),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    save.mutate();
  };

  const dirty =
    displayName !== profile.displayName || bio !== (profile.bio ?? '') || avatarUrl !== (profile.avatarUrl ?? '');

  return (
            <Stack component="form" spacing={3} onSubmit={submit}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar src={avatarUrl || undefined} sx={{ width: 96, height: 96, fontSize: 36, bgcolor: 'primary.main' }}>
                  {initials(displayName || profile.displayName)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{displayName || profile.displayName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile.email}
                  </Typography>
                </Box>
              </Stack>
              <TextField
                label="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                error={!displayName.trim()}
                helperText={!displayName.trim() ? 'Display name is required.' : undefined}
                slotProps={{ htmlInput: { maxLength: 100 } }}
              />
              <TextField label="Email" value={profile.email} disabled helperText="Email can't be changed." />
              <TextField
                label="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                multiline
                minRows={3}
                placeholder="A few words about you and the events you like."
              />
              <TextField
                label="Avatar URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                type="url"
              />
              <Box>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />} loading={save.isPending} disabled={!dirty}>
                  Save changes
                </Button>
              </Box>
            </Stack>
  );
}
