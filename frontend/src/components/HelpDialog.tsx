import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MailOutlineIcon from '@mui/icons-material/EmailOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNotify } from '../notify/notify';

/** Contact address shown in the help dialog. Override with VITE_SUPPORT_EMAIL. */
const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) || 'support@gatherly.dev';

const faq = [
  {
    q: 'How do I RSVP to an event?',
    a: 'Open the event and choose Going, Interested or No. Click your answer again to remove it. You need to be signed in.',
  },
  {
    q: 'Where do I find events I saved?',
    a: 'Tap the heart on an event to add it to Favorites. Events you are going to or interested in are under Attending.',
  },
  {
    q: 'How do I organize my own event?',
    a: 'Sign in and use Create event. You can edit or delete it later from My events.',
  },
  {
    q: 'Why can\'t I mark "Going"?',
    a: 'The event has reached its capacity. You can still mark it as Interested.',
  },
];

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const notify = useNotify();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      notify('Email copied to clipboard', 'info');
    } catch {
      notify("Couldn't copy, please select the address manually", 'warning');
    }
  };

  return (
    <>
      <Tooltip title="Help & contact">
        <IconButton onClick={() => setOpen(true)} aria-label="Help and contact">
          <HelpOutlineIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Help & contact</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5}>
            <Box>
              {faq.map((item) => (
                <Accordion key={item.q} disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, bgcolor: 'transparent' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                    <Typography variant="subtitle2">{item.q}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 0 }}>
                    <Typography variant="body2" color="text.secondary">
                      {item.a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Still need help? Found a problem?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Write to us and we'll get back to you as soon as we can.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
                <Typography variant="body1" sx={{ fontWeight: 600, flexGrow: 1, wordBreak: 'break-all' }}>
                  {SUPPORT_EMAIL}
                </Typography>
                <Button size="small" startIcon={<ContentCopyIcon />} onClick={copy}>
                  Copy
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<MailOutlineIcon />}
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Gatherly - help')}`}
                >
                  Send email
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
