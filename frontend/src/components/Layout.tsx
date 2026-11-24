import { useState } from 'react';
import { Link as RouterLink, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import ExploreIcon from '@mui/icons-material/Explore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { useAuth } from '../auth/useAuth';
import { useColorMode } from '../theme/colorMode';
import { initials } from '../lib/format';
import { HelpButton } from './HelpDialog';

const accountLinks = [
  { to: '/me/events', label: 'My events', icon: <EventIcon fontSize="small" /> },
  { to: '/me/attending', label: 'Attending', icon: <EventAvailableIcon fontSize="small" /> },
  { to: '/me/favorites', label: 'Favorites', icon: <FavoriteIcon fontSize="small" /> },
  { to: '/profile', label: 'Profile', icon: <PersonIcon fontSize="small" /> },
];

const topBarPaths = ['/me/attending', '/me/favorites'];

export function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggle } = useColorMode();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    setMenuAnchor(null);
    setDrawerOpen(false);
    logout();
    navigate('/');
  };

  const navButtonSx = {
    color: 'text.secondary',
    '&.active': { color: 'primary.main', bgcolor: 'action.selected' },
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" sx={{ borderBottom: 1, borderColor: 'divider', backdropFilter: 'blur(8px)' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 1 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
                <MenuIcon />
              </IconButton>
            )}
            <Box
              component={RouterLink}
              to="/"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'inherit', textDecoration: 'none', mr: 2 }}
            >
              <CelebrationIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                Gatherly
              </Typography>
            </Box>

            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button component={NavLink} to="/" end startIcon={<ExploreIcon />} sx={navButtonSx}>
                  Discover
                </Button>
                {isAuthenticated && (
                  <>
                    <Button component={NavLink} to="/me/attending" startIcon={<EventAvailableIcon />} sx={navButtonSx}>
                      Attending
                    </Button>
                    <Button component={NavLink} to="/me/favorites" startIcon={<FavoriteIcon />} sx={navButtonSx}>
                      Favorites
                    </Button>
                  </>
                )}
              </Box>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <HelpButton />
            <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
              <IconButton onClick={toggle} aria-label="Toggle color mode">
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {isAuthenticated && user ? (
              <>
                {!isMobile && (
                  <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/events/new">
                    Create event
                  </Button>
                )}
                <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="Account menu">
                  <Avatar src={user.avatarUrl ?? undefined} sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}>
                    {initials(user.displayName)}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={!!menuAnchor}
                  onClose={() => setMenuAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2">{user.displayName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                  <Divider />
                  {/* Attending/Favorites live in the top bar (desktop) and the drawer (mobile). */}
                  {accountLinks.filter((l) => !topBarPaths.includes(l.to)).map((l) => (
                    <MenuItem
                      key={l.to}
                      component={RouterLink}
                      to={l.to}
                      onClick={() => setMenuAnchor(null)}
                    >
                      <ListItemIcon>{l.icon}</ListItemIcon>
                      {l.label}
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Sign out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button component={RouterLink} to="/login" startIcon={<LoginIcon />}>
                  Sign in
                </Button>
                {!isMobile && (
                  <Button variant="contained" component={RouterLink} to="/register">
                    Sign up
                  </Button>
                )}
              </>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260 }} role="navigation" onClick={() => setDrawerOpen(false)}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
            <CelebrationIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Gatherly
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItemButton component={NavLink} to="/" end>
              <ListItemIcon>
                <ExploreIcon />
              </ListItemIcon>
              <ListItemText primary="Discover" />
            </ListItemButton>
            {isAuthenticated ? (
              <>
                <ListItemButton component={NavLink} to="/events/new">
                  <ListItemIcon>
                    <AddIcon />
                  </ListItemIcon>
                  <ListItemText primary="Create event" />
                </ListItemButton>
                {accountLinks.map((l) => (
                  <ListItemButton key={l.to} component={NavLink} to={l.to}>
                    <ListItemIcon>{l.icon}</ListItemIcon>
                    <ListItemText primary={l.label} />
                  </ListItemButton>
                ))}
                <Divider sx={{ my: 1 }} />
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Sign out" />
                </ListItemButton>
              </>
            ) : (
              <>
                <ListItemButton component={NavLink} to="/login">
                  <ListItemIcon>
                    <LoginIcon />
                  </ListItemIcon>
                  <ListItemText primary="Sign in" />
                </ListItemButton>
                <ListItemButton component={NavLink} to="/register">
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="Sign up" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 4 } }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>

      <Box component="footer" sx={{ py: 3, borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            Gatherly · Local events in Timișoara
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
