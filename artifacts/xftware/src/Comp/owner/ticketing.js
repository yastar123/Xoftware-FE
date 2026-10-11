import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Badge, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel, List, ListItemAvatar, ListItemButton, MenuItem, Pagination, Select, Stack, TextField, Tooltip, Typography, useMediaQuery, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaChevronLeft, FaPaperclip, FaPlus, FaSearch, FaSyncAlt, FaTimes } from 'react-icons/fa';
import { reqOwner } from '@/lib/requestApi';
import { renderWhatsappText } from '@/lib/renderFormatWhatsApp';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function formatDateTimeID(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('id-ID', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatTimeOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function statusChipProps(status) {
  if (status === 'open') return { variant: 'filled', color: 'primary' };
  if (status === 'in_progress') return { variant: 'filled', color: 'warning' };
  if (status === 'resolved') return { variant: 'filled', color: 'success' };
  if (status === 'closed') return { variant: 'filled', color: 'default' };
  return { variant: 'filled', color: 'default' };
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => { const result = fr.result || ''; resolve(String(result).split(',')[1] || ''); };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export default function TicketingOwnerPage() {
  const isMobile = useMediaQuery('(max-width:900px)');
  const [problemTypes, setProblemTypes] = useState([]);
  const [loadingPT, setLoadingPT] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [problemTypeId, setProblemTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ problem_type_id: '', subject: '', description: '', priority: 'medium' });
  const [createScreens, setCreateScreens] = useState([]);
  const [replyScreens, setReplyScreens] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const createFileRef = useRef(null);
  const replyFileRef = useRef(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [imgViewerOpen, setImgViewerOpen] = useState(false);
  const [imgViewerUrls, setImgViewerUrls] = useState([]);
  const [imgViewerIndex, setImgViewerIndex] = useState(0);
  
  const chatContainerRef = useRef(null);

  const openImageViewer = (urls, startIndex = 0) => { setImgViewerUrls(urls || []); setImgViewerIndex(Math.max(0, startIndex)); setImgViewerOpen(true); };
  const closeImageViewer = () => setImgViewerOpen(false);
  const nextImg = useCallback(() => setImgViewerIndex(i => Math.min(i + 1, (imgViewerUrls?.length || 1) - 1)), [imgViewerUrls?.length]);
  const prevImg = useCallback(() => setImgViewerIndex(i => Math.max(i - 1, 0)), []);

  const fetchProblemTypes = async () => {
    setLoadingPT(true);
    const res = await reqOwner({ action: 'ticket.problemTypes' });
    setLoadingPT(false);
    if (res?.error) return toast.error(res.message || 'Gagal memuat problem types');
    setProblemTypes(res.data || []);
  };

  const fetchTickets = async (opts = {}) => {
    const nextPage = opts.page ?? page;
    setLoadingList(true);
    const payload = { action: 'ticket.list', page: nextPage, q: q.trim(), status: status || undefined, priority: priority || undefined, problem_type_id: problemTypeId ? Number(problemTypeId) : undefined, startDate: startDate || undefined, endDate: endDate || undefined };
    const res = await reqOwner(payload);
    setLoadingList(false);
    if (res?.error) return toast.error(res.message || 'Gagal memuat tickets');
    const data = res.data || {};
    setTickets(data.data || []);
    setTotalItems(data.total || 0);
    setPage(data.page || nextPage || 1);
    setTotalPages(data.totalPages || 1);
  };

  const fetchDetail = async ticketId => {
    if (!ticketId) return;
    setLoadingDetail(true);
    const res = await reqOwner({ action: 'ticket.detail', ticket_id: ticketId });
    setLoadingDetail(false);
    if (res?.error) { setDetail(null); return toast.error(res.message || 'Gagal memuat detail ticket'); }
    setDetail(res.data || null);
    
    // Auto scroll to bottom
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchProblemTypes(); fetchTickets({ page: 1 }); }, []);
  useEffect(() => { if (selectedId) fetchDetail(selectedId); }, [selectedId]);
  useEffect(() => { if (!imgViewerOpen) return; const onKey = e => { if (e.key === 'Escape') closeImageViewer(); if (e.key === 'ArrowRight') nextImg(); if (e.key === 'ArrowLeft') prevImg(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [imgViewerOpen, nextImg, prevImg]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (q.trim()) chips.push({ key: 'q', label: `Search: "${q.trim()}"` });
    if (status) chips.push({ key: 's', label: `status: ${status}` });
    if (priority) chips.push({ key: 'p', label: `priority: ${priority}` });
    if (problemTypeId) { const pt = problemTypes.find(x => String(x.id) === String(problemTypeId)); chips.push({ key: 'pt', label: `type: ${pt?.name || problemTypeId}` }); }
    if (startDate) chips.push({ key: 'sd', label: `Start: ${startDate}` });
    if (endDate) chips.push({ key: 'ed', label: `End: ${endDate}` });
    return chips;
  }, [q, status, priority, problemTypeId, startDate, endDate, problemTypes]);

  const resetFilters = () => { setQ(''); setStatus(''); setPriority(''); setProblemTypeId(''); setStartDate(''); setEndDate(''); setPage(1); setTimeout(() => fetchTickets({ page: 1 }), 0); };
  const onSelectTicket = id => { setSelectedId(id); };

  const uploadImagesToCdn = async files => {
    const urls = [];
    for (const f of Array.from(files || [])) {
      const base64 = await readFileAsBase64(f);
      const up = await reqOwner({ action: 'uploadImage', thumbnailBuffer: base64 });
      if (up?.error) throw new Error(up?.message || 'Upload gagal');
      urls.push(up.data);
    }
    return urls;
  };

  const addCreateScreens = async files => {
    if (!files?.length) return;
    try { const urls = await uploadImagesToCdn(files); setCreateScreens(prev => [...prev, ...urls.map(url => ({ url }))]); toast.success(`Uploaded ${urls.length} image`); } catch (e) { toast.error(e?.message || 'Gagal upload image'); }
  };

  const addReplyScreens = async files => {
    if (!files?.length) return;
    try { const urls = await uploadImagesToCdn(files); setReplyScreens(prev => [...prev, ...urls.map(url => ({ url }))]); toast.success(`Uploaded ${urls.length} image`); } catch (e) { toast.error(e?.message || 'Gagal upload image'); }
  };

  const openCreate = () => { setCreateForm({ problem_type_id: problemTypes?.[0]?.id ? String(problemTypes[0].id) : '', subject: '', description: '', priority: 'medium' }); setCreateScreens([]); setCreateOpen(true); };

  const submitCreate = async () => {
    const problem_type_id = Number(createForm.problem_type_id);
    const subject = (createForm.subject || '').trim();
    const description = (createForm.description || '').trim();
    if (!problem_type_id || !subject || !description) return toast.error('Problem type, subject, dan description wajib diisi.');
    setCreating(true);
    const res = await reqOwner({ action: 'ticket.create', problem_type_id, subject, description, priority: createForm.priority, screenshots_urls: createScreens.map(x => x.url) });
    setCreating(false);
    if (res?.error) return toast.error(res.message || 'Gagal membuat ticket');
    toast.success(res.message || 'Ticket created');
    setCreateOpen(false);
    setCreateScreens([]);
    await fetchTickets({ page: 1 });
    if (res?.data?.id) setSelectedId(res.data.id);
  };

  const sendReply = async () => {
    if (!selectedId) return;
    const message = (replyText || '').trim();
    if (!message && !replyScreens.length) return toast.error('Pesan atau attachment tidak boleh kosong');
    if (detail?.status === 'closed') return toast.error('Ticket sudah closed');
    setSendingReply(true);
    const res = await reqOwner({ action: 'ticket.reply', ticket_id: selectedId, message: message || 'Attached Media', screenshots_urls: replyScreens.map(x => x.url) });
    setSendingReply(false);
    if (res?.error) return toast.error(res.message || 'Gagal mengirim reply');
    setReplyText(''); setReplyScreens([]);
    await fetchDetail(selectedId);
    await fetchTickets({ page });
  };

  const closeTicket = async () => {
    if (!selectedId) return;
    if (detail?.status === 'closed') return toast.error('Ticket sudah closed');
    const res = await reqOwner({ action: 'ticket.close', ticket_id: selectedId });
    if (res?.error) return toast.error(res.message || 'Gagal close ticket');
    toast.success(res.message || 'Ticket closed');
    await fetchDetail(selectedId);
    await fetchTickets({ page });
  };

  // Chat Bubble Component
  const ChatBubble = ({ isYou, senderName, time, text, attachments = [] }) => (
    <Box sx={{ display: 'flex', justifyContent: isYou ? 'flex-end' : 'flex-start', mb: 2 }}>
      <Box sx={{ 
        maxWidth: { xs: '85%', sm: '75%' }, 
        bgcolor: isYou ? '#6366f1' : '#ffffff', 
        color: isYou ? '#ffffff' : 'text.primary',
        borderRadius: 2, 
        borderTopRightRadius: isYou ? 0 : 8,
        borderTopLeftRadius: !isYou ? 0 : 8,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        p: 1.5,
        position: 'relative'
      }}>
        {!isYou && <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 'bold', mb: 0.5, display: 'block' }}>{senderName}</Typography>}
        
        {attachments.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: text ? 1 : 0 }}>
            {attachments.map(a => (
              <Box key={a.id} component="img" src={a.url} onClick={() => openImageViewer(attachments.map(x => x.url), attachments.findIndex(x => x.id === a.id))} sx={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 1, cursor: 'pointer', border: isYou ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)' }} />
            ))}
          </Box>
        )}
        
        {text && (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '14px', lineHeight: 1.5 }}>
            {renderWhatsappText(text)}
          </Typography>
        )}
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', color: isYou ? 'rgba(255,255,255,0.7)' : 'text.secondary', mt: 0.5, fontSize: '11px' }}>
          {time}
        </Typography>
      </Box>
    </Box>
  );

  const ListPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="h6" fontWeight={800}>Tickets</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button size="small" variant="outlined" onClick={() => setFilterOpen(true)} sx={{ borderRadius: 2, textTransform: 'none', minWidth: 0, px: 1.5 }}>Filter</Button>
            <Tooltip title="Refresh"><IconButton size="small" onClick={() => fetchTickets({ page })} sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', borderRadius: 2 }}><FaSyncAlt size={14} /></IconButton></Tooltip>
            <Button size="small" variant="contained" onClick={openCreate} sx={{ borderRadius: 2, textTransform: 'none', minWidth: 0, px: 1.5 }}><FaPlus /></Button>
          </Stack>
        </Stack>
        <Box sx={{ mt: 2 }}>
          <TextField size="small" fullWidth placeholder="Search ticket_no / subject..." value={q} onChange={e => setQ(e.target.value)} InputProps={{ endAdornment: <IconButton onClick={() => fetchTickets({ page: 1 })} edge="end"><FaSearch size={14} /></IconButton>, sx: { borderRadius: 3, bgcolor: alpha('#000', 0.03) } }} />
        </Box>
        <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          {activeChips.slice(0, 2).map(c => <Chip key={c.key} size="small" label={c.label} sx={{ borderRadius: 1.5 }} />)}
          {activeChips.length > 2 && <Chip size="small" label={`+${activeChips.length - 2} filters`} sx={{ borderRadius: 1.5 }} />}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loadingList ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={24} /></Box>
        ) : (
          <List disablePadding>
            {tickets.map(t => {
              const selected = selectedId === t.id;
              return (
                <ListItemButton
                  key={t.id}
                  selected={selected}
                  onClick={() => onSelectTicket(t.id)}
                  sx={{ 
                    alignItems: 'flex-start', px: 2, py: 1.5, gap: 1.5, borderBottom: '1px solid', borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: alpha('#6366f1', 0.04) }, 
                    '&.Mui-selected': { bgcolor: alpha('#6366f1', 0.1) }, 
                    '&.Mui-selected:hover': { bgcolor: alpha('#6366f1', 0.15) } 
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 44, mt: 0 }}>
                    <Badge overlap="circular" variant="dot" invisible={t.status !== 'open' && t.status !== 'in_progress'} color={t.status === 'open' ? 'error' : 'warning'} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: alpha('#6366f1', selected ? 1 : 0.1), color: selected ? '#fff' : '#6366f1', fontWeight: 700, fontSize: '1.2rem' }}>
                        {(t.priority || 'm').slice(0, 1).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                      <Typography fontWeight={selected ? 800 : 700} sx={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.subject || '(Tidak ada subjek)'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: selected ? 'primary.main' : 'text.secondary', whiteSpace: 'nowrap', fontWeight: selected ? 600 : 400 }}>
                        {formatTimeOnly(t.last_activity_at || t.createdAt)}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 0.75 }}>
                      {t.ticket_no || `#${t.id}`}
                    </Typography>
                    <Stack direction="row" spacing={0.75}>
                      <Chip size="small" label={t.status} {...statusChipProps(t.status)} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                      <Chip size="small" label={t.problem_type?.name || 'Issue'} variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    </Stack>
                  </Box>
                </ListItemButton>
              );
            })}
            {tickets.length === 0 && (
              <Box sx={{ px: 2, py: 6, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Belum ada tiket.</Typography>
              </Box>
            )}
          </List>
        )}
      </Box>
      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
        <Pagination page={page} count={totalPages} onChange={(_, p) => fetchTickets({ page: p })} color="primary" shape="rounded" size="small" siblingCount={0} />
      </Box>
    </Box>
  );

  const EmptyStatePanel = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3, bgcolor: '#f3f4f6' }}>
      <Box sx={{ width: 120, height: 120, borderRadius: '50%', bgcolor: alpha('#6366f1', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
        <FaSearch size={48} color="#6366f1" opacity={0.5} />
      </Box>
      <Typography variant="h5" fontWeight={800} color="text.primary" gutterBottom>Xoftware Ticketing</Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
        Pilih tiket dari daftar di sebelah kiri untuk melihat detail dan membalas pesan.
      </Typography>
    </Box>
  );

  const DetailPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f3f4f6' }}>
      {/* Chat Header */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        {isMobile && (
          <IconButton onClick={() => setSelectedId(null)} sx={{ ml: -1 }}>
            <FaChevronLeft size={18} />
          </IconButton>
        )}
        <Avatar sx={{ width: 40, height: 40, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', fontWeight: 700 }}>
          {detail?.priority?.slice(0, 1).toUpperCase() || 'T'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ lineHeight: 1.2 }}>
            {detail?.subject || (selectedId ? `Ticket #${selectedId}` : 'Memuat...')}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {detail?.ticket_no} • {detail?.problem_type?.name}
          </Typography>
        </Box>
        {detail?.status && <Chip size="small" label={detail.status} {...statusChipProps(detail.status)} sx={{ fontWeight: 700 }} />}
      </Box>

      {/* Chat Area */}
      <Box ref={chatContainerRef} sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, sm: 3 }, display: 'flex', flexDirection: 'column' }}>
        {loadingDetail ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 'auto' }}><CircularProgress size={32} /></Box>
        ) : detail ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Chip size="small" label={`Dibuat pada ${formatDateTimeID(detail.createdAt)}`} sx={{ bgcolor: alpha('#000', 0.05), color: 'text.secondary', fontWeight: 600 }} />
            </Box>
            
            {/* Initial Opening Message */}
            <ChatBubble 
              isYou={true} 
              time={formatTimeOnly(detail.createdAt)} 
              text={detail.description} 
              attachments={detail.attachments || []} 
            />

            {/* Replies */}
            {(detail.messages || []).map(m => {
              const isDev = m.sender_type === 'developer';
              return (
                <ChatBubble 
                  key={m.id}
                  isYou={!isDev}
                  senderName={isDev ? 'Developer' : 'You'}
                  time={formatTimeOnly(m.createdAt)}
                  text={m.message}
                  attachments={m.attachments || []}
                />
              );
            })}
            
            {detail.status === 'closed' && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
                <Chip size="small" label={`Tiket ditutup pada ${formatDateTimeID(detail.closed_at || detail.last_activity_at)}`} sx={{ bgcolor: alpha('#000', 0.05), color: 'text.secondary', fontWeight: 600 }} />
              </Box>
            )}
          </>
        ) : null}
      </Box>

      {/* Chat Input Area */}
      {detail && (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={1.5}>
            {/* Attachment Preview Area */}
            {!!replyScreens.length && (
              <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                {replyScreens.map((x, idx) => (
                  <Box key={x.url + idx} sx={{ position: 'relative', width: 72, height: 72, flexShrink: 0, borderRadius: 2, overflow: 'hidden', border: '2px solid #6366f1' }}>
                    <Box component="img" src={x.url} alt="screenshot" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton size="small" onClick={() => setReplyScreens(prev => prev.filter((_, i) => i !== idx))} sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', p: 0.25, '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}><FaTimes size={10} /></IconButton>
                  </Box>
                ))}
              </Box>
            )}
            
            <Stack direction="row" spacing={1} alignItems="flex-end">
              <input ref={replyFileRef} type="file" accept="image/*" multiple hidden onChange={e => addReplyScreens(e.target.files)} />
              <IconButton 
                onClick={() => replyFileRef.current?.click()} 
                disabled={detail.status === 'closed'} 
                sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', '&:hover': { bgcolor: alpha('#6366f1', 0.2) }, mb: 0.5 }}
              >
                <FaPaperclip size={20} />
              </IconButton>
              <TextField 
                multiline 
                maxRows={5} 
                placeholder={detail.status === 'closed' ? 'Tiket sudah ditutup.' : 'Ketik balasan Anda di sini...'} 
                value={replyText} 
                onChange={e => setReplyText(e.target.value)} 
                disabled={detail.status === 'closed' || sendingReply} 
                fullWidth 
                InputProps={{
                  sx: { borderRadius: 3, bgcolor: '#f3f4f6', '& fieldset': { border: 'none' } }
                }}
              />
              <Button 
                variant="contained" 
                onClick={sendReply} 
                disabled={sendingReply || detail.status === 'closed' || (!replyText.trim() && !replyScreens.length)} 
                sx={{ borderRadius: 3, px: 3, py: 1.5, minWidth: 100, mb: 0.5, fontWeight: 700, boxShadow: 'none' }}
              >
                {sendingReply ? '...' : 'Kirim'}
              </Button>
            </Stack>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
               <Button size="small" color="error" onClick={closeTicket} disabled={detail.status === 'closed'} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}>
                 Tutup Tiket Ini
               </Button>
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden', display: 'flex' }}>
      
      {/* LIST PANEL (Shows on desktop always, shows on mobile if NO ticket selected) */}
      {(!isMobile || !selectedId) && (
        <Box sx={{ width: { xs: '100%', md: 380, lg: 420 }, borderRight: { md: '1px solid' }, borderColor: 'divider', flexShrink: 0, zIndex: 1 }}>
          {ListPanel}
        </Box>
      )}

      {/* DETAIL PANEL (Shows on desktop always, shows on mobile ONLY if ticket selected) */}
      {(!isMobile || selectedId) && (
        <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
          {selectedId ? DetailPanel : <EmptyStatePanel />}
        </Box>
      )}

      {/* MODALS */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Buat Tiket Baru</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small" disabled={loadingPT}><InputLabel>Tipe Masalah</InputLabel><Select label="Tipe Masalah" value={createForm.problem_type_id} onChange={e => setCreateForm(p => ({ ...p, problem_type_id: e.target.value }))}>{problemTypes.map(p => <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>)}</Select></FormControl>
            <FormControl fullWidth size="small"><InputLabel>Prioritas</InputLabel><Select label="Prioritas" value={createForm.priority} onChange={e => setCreateForm(p => ({ ...p, priority: e.target.value }))}>{PRIORITY_OPTIONS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}</Select></FormControl>
            <TextField label="Subjek" size="small" value={createForm.subject} onChange={e => setCreateForm(p => ({ ...p, subject: e.target.value }))} fullWidth />
            <TextField label="Deskripsi Detail" size="small" value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} multiline minRows={4} maxRows={8} fullWidth />
            
            <input ref={createFileRef} type="file" accept="image/*" multiple hidden onChange={e => addCreateScreens(e.target.files)} />
            <Button variant="outlined" startIcon={<FaPaperclip />} onClick={() => createFileRef.current?.click()} sx={{ borderRadius: 2, textTransform: 'none', borderStyle: 'dashed' }}>Lampirkan Gambar</Button>
            
            {!!createScreens.length && (
              <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', p: 1, bgcolor: alpha('#000', 0.02), borderRadius: 2 }}>
                {createScreens.map((x, idx) => (
                  <Box key={x.url + idx} sx={{ position: 'relative', width: 72, height: 72, flexShrink: 0, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                    <Box component="img" src={x.url} alt="screenshot" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton size="small" onClick={() => setCreateScreens(prev => prev.filter((_, i) => i !== idx))} sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', p: 0.25, '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}><FaTimes size={10} /></IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>Batal</Button>
          <Button variant="contained" onClick={submitCreate} disabled={creating} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}>{creating ? 'Membuat...' : 'Kirim Tiket'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Filter</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl size="small" fullWidth><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={e => setStatus(e.target.value)}><MenuItem value="">(Semua)</MenuItem>{STATUS_OPTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}</Select></FormControl>
            <FormControl size="small" fullWidth><InputLabel>Prioritas</InputLabel><Select label="Prioritas" value={priority} onChange={e => setPriority(e.target.value)}><MenuItem value="">(Semua)</MenuItem>{PRIORITY_OPTIONS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}</Select></FormControl>
            <FormControl size="small" fullWidth disabled={loadingPT}><InputLabel>Tipe Masalah</InputLabel><Select label="Tipe Masalah" value={problemTypeId} onChange={e => setProblemTypeId(e.target.value)}><MenuItem value="">(Semua)</MenuItem>{problemTypes.map(p => <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>)}</Select></FormControl>
            <Stack direction="row" spacing={1}>
              <TextField size="small" label="Mulai" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField size="small" label="Selesai" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => { resetFilters(); setFilterOpen(false); }} sx={{ borderRadius: 2, textTransform: 'none', color: 'error.main', fontWeight: 600 }}>Reset Semua</Button>
          <Button variant="contained" onClick={() => { fetchTickets({ page: 1 }); setFilterOpen(false); }} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}>Terapkan</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={imgViewerOpen} onClose={closeImageViewer} fullScreen PaperProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.95)'} }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600 }}>{imgViewerUrls?.length ? `${imgViewerIndex + 1} of ${imgViewerUrls.length}` : ''}</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" onClick={prevImg} disabled={imgViewerIndex <= 0} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', borderRadius: 2 }}>Prev</Button>
              <Button variant="outlined" onClick={nextImg} disabled={imgViewerIndex >= (imgViewerUrls.length || 1) - 1} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', borderRadius: 2 }}>Next</Button>
              <IconButton onClick={closeImageViewer} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }}><FaTimes /></IconButton>
            </Stack>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            {imgViewerUrls?.[imgViewerIndex] && <Box component="img" src={imgViewerUrls[imgViewerIndex]} alt="full" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none', borderRadius: 2 }} />}
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}