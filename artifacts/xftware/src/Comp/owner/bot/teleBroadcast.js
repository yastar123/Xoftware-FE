import React, { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, Divider, Stack, TextField, Typography, CircularProgress, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, LinearProgress, ToggleButtonGroup, ToggleButton, IconButton, Grid, Dialog, DialogTitle, DialogContent, DialogActions, Switch } from '@mui/material';
import { Send, Poll, Refresh, History, AttachFile, Close, Add, ViewList, ViewModule, CheckCircle, Error, Info, Campaign } from '@mui/icons-material';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';
import { fileToBase64 } from '@/lib/helper';
import ReactMarkdown from 'react-markdown';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const htmlToMarkdown = (html) => {
  if (!html) return '';
  let text = html;

  // Convert bold
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '*$1*');
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '*$1*');
  // Convert italic
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_');
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_');
  // Convert strike
  text = text.replace(/<s[^>]*>(.*?)<\/s>/gi, '~$1~');
  text = text.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~$1~');
  // Convert code
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  // Convert links
  text = text.replace(/<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  // Convert bullet lists
  text = text.replace(/<li>(.*?)<\/li>/gi, '• $1\n');
  // Replace paragraphs and line breaks
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Strip any remaining HTML tags using DOMParser safely
  if (typeof window !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      return (doc.body.textContent || doc.body.innerText || text).trim();
    } catch (e) { }
  }
  return text.replace(/<[^>]+>/g, '').trim();
};

const markdownToHtml = (markdown) => {
  if (!markdown) return '';
  let html = markdown;

  // Escape HTML entities to prevent rendering raw HTML tags
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert bold
  html = html.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  // Convert italic
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  // Convert strike
  html = html.replace(/~(.*?)~/g, '<s>$1</s>');
  // Convert code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  // Convert links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  // Convert bullet lists
  html = html.replace(/(?:^|\n)•\s*(.*?)(?=\n|$)/g, '\n<li>$1</li>');
  // Wrap paragraphs
  html = html.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('');

  return html;
};

export default function TeleBroadcastPage() {
  const [bcastText, setBcastText] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  const [allowChangeVote, setAllowChangeVote] = useState(false);
  const [bcastButtons, setBcastButtons] = useState([]);

  const [loadingBcast, setLoadingBcast] = useState(false);
  const [loadingPoll, setLoadingPoll] = useState(false);

  const [activePolls, setActivePolls] = useState([]);
  const [histories, setHistories] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [parseMode, setParseMode] = useState('Markdown');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);

  const [historyViewMode, setHistoryViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tele_bcast_history_view') || 'table';
    }
    return 'table';
  });

  const handleHistoryViewModeChange = (mode) => {
    setHistoryViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tele_bcast_history_view', mode);
    }
  };

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      setBcastText(editor.getHTML());
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Maksimal ukuran file 5 MB');

    const base64 = await fileToBase64(file);
    setMediaFile(base64);

    setMediaPreview({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
      name: file.name
    });
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const resHist = await reqOwner({ action: 'tele.broadcast.history', limit: 5 });
      if (!resHist.error) setHistories(resHist.data || []);

      const resPoll = await reqOwner({ action: 'tele.poll.active' });
      if (!resPoll.error) setActivePolls(resPoll.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Poll options helpers
  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length <= 2) return;
    const updated = pollOptions.filter((_, idx) => idx !== index);
    setPollOptions(updated);
  };

  const handlePollOptionChange = (index, value) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  // Broadcast buttons helpers
  const handleAddBcastButton = () => {
    setBcastButtons([...bcastButtons, { text: '', url: '' }]);
  };

  const handleRemoveBcastButton = (index) => {
    const updated = bcastButtons.filter((_, idx) => idx !== index);
    setBcastButtons(updated);
  };

  const handleBcastButtonChange = (index, field, value) => {
    const updated = [...bcastButtons];
    updated[index] = { ...updated[index], [field]: value };
    setBcastButtons(updated);
  };

  const handleSendBroadcast = async () => {
    if (!bcastText.trim() && !mediaFile) return toast.error('Pesan atau lampiran tidak boleh kosong');

    const cleanButtons = bcastButtons.filter(b => b.text.trim() && b.url.trim());

    setLoadingBcast(true);
    const res = await reqOwner({
      action: 'tele.broadcast.create',
      message: bcastText,
      mediaBuffer: mediaFile,
      parseMode,
      buttons: cleanButtons
    });
    setLoadingBcast(false);

    if (res.error) return toast.error(res.message);
    toast.success('Broadcast berhasil dimulai!');
    setBcastText('');
    editor?.commands.setContent('');
    handleRemoveMedia();
    setBcastButtons([]);
    setBroadcastDialogOpen(false);
    fetchData();
  };

  const handleSendPoll = async () => {
    if (!pollQuestion.trim()) return toast.error('Pertanyaan tidak boleh kosong');
    const options = pollOptions.map(s => s.trim()).filter(Boolean);
    if (options.length < 2) return toast.error('Minimal harus ada 2 pilihan jawaban');
    if (options.length > 10) return toast.error('Maksimal 10 pilihan jawaban untuk Telegram Poll');

    setLoadingPoll(true);
    const res = await reqOwner({
      action: 'tele.poll.create',
      question: pollQuestion,
      options,
      isAnonymous,
      allowMultipleAnswers,
      allowChangeVote,
    });
    setLoadingPoll(false);

    if (res.error) return toast.error(res.message);
    toast.success('Poll native Telegram berhasil disebar!');
    setPollQuestion('');
    setPollOptions(['', '']);
    setIsAnonymous(true);
    setAllowMultipleAnswers(false);
    setPollDialogOpen(false);
    fetchData();
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Broadcast & Poll Telegram</Typography>
          <Typography variant="caption" color="text.secondary">Kirim pesan massal atau poling interaktif ke semua user Telegram</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button startIcon={<Refresh />} onClick={fetchData} disabled={loadingData} size="small" variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
            Refresh
          </Button>
          <Button startIcon={<Send />} onClick={() => setBroadcastDialogOpen(true)} size="small" variant="contained" sx={{ borderRadius: 2, backgroundColor: '#6366f1', color: '#fff', '&:hover': { backgroundColor: '#4f46e5' }, textTransform: 'none' }}>
            Broadcast
          </Button>
          <Button startIcon={<Poll />} onClick={() => setPollDialogOpen(true)} size="small" variant="contained" color="secondary" sx={{ borderRadius: 2, textTransform: 'none' }}>
            Poling
          </Button>
        </Box>
      </Stack>

      <Stack spacing={3}>
        {/* Dialog Kirim Broadcast */}
        <Dialog open={broadcastDialogOpen} onClose={loadingBcast ? undefined : () => setBroadcastDialogOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Kirim Broadcast Telegram
            <IconButton onClick={() => setBroadcastDialogOpen(false)} disabled={loadingBcast}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
                <ToggleButtonGroup
                  value={parseMode}
                  exclusive
                  onChange={(e, v) => {
                    if (v) {
                      setParseMode(v);
                      if (v === 'HTML') {
                        const converted = markdownToHtml(bcastText);
                        setBcastText(converted);
                        if (editor) editor.commands.setContent(converted);
                      } else if (v === 'Markdown') {
                        const converted = htmlToMarkdown(bcastText);
                        setBcastText(converted);
                      }
                    }
                  }}
                  size="small"
                  fullWidth
                  sx={{ display: 'flex' }}
                >
                  <ToggleButton value="Markdown" sx={{ flexGrow: 1 }}>Markdown</ToggleButton>
                  <ToggleButton value="HTML" sx={{ flexGrow: 1 }}>HTML</ToggleButton>
                </ToggleButtonGroup>

                <Button component="label" variant="outlined" startIcon={<AttachFile />} size="small" sx={{ textTransform: 'none', borderRadius: 2, py: { xs: 1, sm: 0.5 }, justifyContent: 'center' }}>
                  Lampirkan Media
                  <input type="file" hidden accept="image/*,video/mp4,application/pdf" onChange={handleFileChange} />
                </Button>
              </Stack>

              {mediaPreview && (
                <Box position="relative" display="inline-block" sx={{ alignSelf: 'flex-start' }}>
                  {mediaPreview.type === 'image' ? (
                    <Box component="img" src={mediaPreview.url} alt="preview" sx={{ maxWidth: 150, maxHeight: 150, borderRadius: 2 }} />
                  ) : (
                    <Chip icon={<AttachFile />} label={mediaPreview.name} variant="outlined" />
                  )}
                  <IconButton
                    size="small"
                    color="error"
                    onClick={handleRemoveMedia}
                    sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'background.paper' } }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              )}

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 1.5, md: 2 }} alignItems="stretch">
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="caption" color="text.secondary" mb={1} display="block">Editor {parseMode}</Typography>
                  {parseMode === 'Markdown' ? (
                    <TextField
                      multiline rows={8} fullWidth size="small"
                      value={bcastText}
                      onChange={e => setBcastText(e.target.value)}
                      placeholder="Gunakan *bold*, _italic_, [link](url), atau `code`"
                      sx={{ '.MuiInputBase-root': { height: '100%', alignItems: 'flex-start' } }}
                    />
                  ) : (
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1, minHeight: 200, bgcolor: 'background.paper' }}>
                      {/* Toolbar */}
                      <Stack direction="row" spacing={0.5} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1, mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        <Button size="small" variant={editor?.isActive('bold') ? 'contained' : 'outlined'} onClick={() => editor?.chain().focus().toggleBold().run()} sx={{ minWidth: 32, height: 32, p: 0 }}><b>B</b></Button>
                        <Button size="small" variant={editor?.isActive('italic') ? 'contained' : 'outlined'} onClick={() => editor?.chain().focus().toggleItalic().run()} sx={{ minWidth: 32, height: 32, p: 0 }}><i>I</i></Button>
                        <Button size="small" variant={editor?.isActive('strike') ? 'contained' : 'outlined'} onClick={() => editor?.chain().focus().toggleStrike().run()} sx={{ minWidth: 32, height: 32, p: 0 }}><s>S</s></Button>
                        <Button size="small" variant={editor?.isActive('code') ? 'contained' : 'outlined'} onClick={() => editor?.chain().focus().toggleCode().run()} sx={{ minWidth: 32, height: 32, p: 0, textTransform: 'none' }}><code>Code</code></Button>
                      </Stack>
                      <Box sx={{ '& .ProseMirror': { outline: 'none', minHeight: 150 } }}>
                        <EditorContent editor={editor} />
                      </Box>
                    </Box>
                  )}
                </Box>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="caption" color="text.secondary" mb={1} display="block">Live Preview Telegram</Typography>
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, minHeight: 200, maxHeight: 350, overflowY: 'auto', '& p': { m: 0 } }}>
                    {mediaPreview?.type === 'image' && (
                      <Box component="img" src={mediaPreview.url} alt="preview" sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 1, mb: 1 }} />
                    )}
                    {parseMode === 'Markdown' ? (
                      <ReactMarkdown>{bcastText || '*Pratinjau pesan Anda di sini*'}</ReactMarkdown>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: bcastText || '<i>Pratinjau pesan Anda di sini</i>' }} />
                    )}
                    {bcastButtons.length > 0 && (
                      <Stack spacing={1} sx={{ mt: 2 }}>
                        {bcastButtons.map((btn, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              p: 1,
                              bgcolor: 'rgba(0, 0, 0, 0.05)',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              borderRadius: 1,
                              textAlign: 'center',
                              fontSize: '0.85rem',
                              color: '#2481cc',
                              fontWeight: 500,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {btn.text || 'Label Tombol'}
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Box>
              </Stack>

              <Divider />

              <Box>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Tombol Aksi (Opsional)</Typography>
                <Stack spacing={1.5}>
                  {bcastButtons.map((btn, idx) => (
                    <Stack key={idx} direction="row" spacing={1.5} alignItems="center">
                      <TextField
                        label="Label Tombol"
                        size="small"
                        value={btn.text}
                        onChange={e => handleBcastButtonChange(idx, 'text', e.target.value)}
                        placeholder="Hubungi Kami"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Tautan (URL atau /start)"
                        size="small"
                        value={btn.url}
                        onChange={e => handleBcastButtonChange(idx, 'url', e.target.value)}
                        placeholder="https://... atau /start reff123"
                        sx={{ flex: 2 }}
                      />
                      <IconButton color="error" onClick={() => handleRemoveBcastButton(idx)} size="small">
                        <Close fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={handleAddBcastButton}
                    sx={{ alignSelf: 'flex-start', textTransform: 'none', borderRadius: 2 }}
                  >
                    Tambah Tombol
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setBroadcastDialogOpen(false)} disabled={loadingBcast} sx={{ textTransform: 'none', borderRadius: 2 }}>Batal</Button>
            <Button
              variant="contained"
              startIcon={loadingBcast ? <CircularProgress size={16} color="inherit" /> : <Send />}
              onClick={handleSendBroadcast}
              disabled={loadingBcast}
              disableElevation
              sx={{ textTransform: 'none', borderRadius: 2, backgroundColor: '#6366f1', color: '#fff', '&:hover': { backgroundColor: '#4f46e5' } }}
            >
              Kirim
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Buat Poling */}
        <Dialog open={pollDialogOpen} onClose={loadingPoll ? undefined : () => setPollDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Buat Poling Telegram
            <IconButton onClick={() => setPollDialogOpen(false)} disabled={loadingPoll}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Pertanyaan"
                fullWidth
                multiline
                rows={3}
                size="small"
                value={pollQuestion}
                onChange={e => setPollQuestion(e.target.value)}
                placeholder="Bagaimana pelayanan kami?"
              />

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2" fontWeight={700}>Pilihan Jawaban</Typography>

              <Stack spacing={1.5}>
                {pollOptions.map((opt, idx) => (
                  <Stack key={idx} direction="row" spacing={1} alignItems="center">
                    <TextField
                      label={`Pilihan ${idx + 1}`}
                      fullWidth
                      size="small"
                      value={opt}
                      onChange={e => handlePollOptionChange(idx, e.target.value)}
                      placeholder={`Jawaban opsi ${idx + 1}`}
                    />
                    <IconButton
                      color="error"
                      onClick={() => handleRemovePollOption(idx)}
                      disabled={pollOptions.length <= 2}
                      size="small"
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={handleAddPollOption}
                  disabled={pollOptions.length >= 10}
                  sx={{ alignSelf: 'flex-start', textTransform: 'none', borderRadius: 2 }}
                >
                  Tambah Pilihan {pollOptions.length >= 10 ? '(Maks 10)' : ''}
                </Button>
              </Stack>

              <Divider sx={{ my: 0.5 }} />

              <Typography variant="subtitle2" fontWeight={700}>Pengaturan Poling</Typography>

              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Anonymous Voting</Typography>
                  <Typography variant="caption" color="text.secondary">Pilihan voter bersifat anonim/rahasia</Typography>
                </Box>
                <Switch
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  color="secondary"
                />
              </Box>

              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Multiple Answers</Typography>
                  <Typography variant="caption" color="text.secondary">Pemilih dapat memilih lebih dari satu jawaban</Typography>
                </Box>
                <Switch
                  checked={allowMultipleAnswers}
                  onChange={(e) => setAllowMultipleAnswers(e.target.checked)}
                  color="secondary"
                />
              </Box>

              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Izinkan Ubah Jawaban</Typography>
                  <Typography variant="caption" color="text.secondary">Pemilih dapat mengganti pilihan mereka setelah memilih</Typography>
                </Box>
                <Switch
                  checked={allowChangeVote}
                  onChange={(e) => setAllowChangeVote(e.target.checked)}
                  color="secondary"
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setPollDialogOpen(false)} disabled={loadingPoll} sx={{ textTransform: 'none', borderRadius: 2 }}>Batal</Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={loadingPoll ? <CircularProgress size={16} color="inherit" /> : <Poll />}
              onClick={handleSendPoll}
              disabled={loadingPoll}
              disableElevation
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Kirim
            </Button>
          </DialogActions>
        </Dialog>

        <Divider />

        {/* Analytics & History Section */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2, md: 3 }} alignItems="stretch">
          {/* Active Polls */}
          <Box sx={{ width: { xs: '100%', md: '41.666%' } }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
              <Poll fontSize="small" color="primary" /> Poling Aktif & Hasil
            </Typography>
            {activePolls.length === 0 ? (
              <Card variant="outlined" sx={{ borderRadius: 3, p: 3, textAlign: 'center', borderStyle: 'dashed', bgcolor: 'rgba(99, 102, 241, 0.01)' }}>
                <CardContent>
                  <Box sx={{ color: 'text.disabled', mb: 2 }}>
                    <Campaign sx={{ fontSize: 40 }} />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>Tidak ada poling aktif</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    Buat poling baru interaktif Telegram Anda secara langsung.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setPollDialogOpen(true)}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Buat Poling Baru
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={2}>
                {activePolls.map(poll => {
                  const maxPercent = Math.max(...poll.options.map(opt => opt.percentage), 0);
                  return (
                    <Card
                      key={poll.id}
                      sx={{
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.3s',
                        '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Typography fontWeight={700} sx={{ pr: 2, fontSize: '1rem', lineHeight: 1.4 }}>
                            {poll.question}
                          </Typography>
                          <Chip
                            label={`${poll.totalVotes} Suara`}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 600, fontSize: 11 }}
                          />
                        </Box>
                        <Stack spacing={2}>
                          {poll.options.map((opt, idx) => {
                            const isLeading = opt.percentage === maxPercent && maxPercent > 0;
                            return (
                              <Box
                                key={idx}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2,
                                  bgcolor: isLeading ? 'rgba(99, 102, 241, 0.04)' : 'rgba(0, 0, 0, 0.01)',
                                  border: '1px solid',
                                  borderColor: isLeading ? 'rgba(99, 102, 241, 0.15)' : 'rgba(0, 0, 0, 0.03)',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    borderColor: isLeading ? 'rgba(99, 102, 241, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                                    bgcolor: isLeading ? 'rgba(99, 102, 241, 0.06)' : 'rgba(0, 0, 0, 0.02)',
                                  }
                                }}
                              >
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="body2" fontWeight={isLeading ? 700 : 500} color={isLeading ? 'primary.main' : 'text.primary'}>
                                    {opt.text}
                                  </Typography>
                                  <Typography variant="body2" fontWeight={700} color={isLeading ? 'primary.main' : 'text.secondary'}>
                                    {opt.percentage}% ({opt.votes})
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={opt.percentage}
                                  sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 4,
                                      backgroundColor: isLeading ? '#6366f1' : '#cbd5e1'
                                    }
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>

          {/* Histories */}
          <Box sx={{ width: { xs: '100%', md: '58.333%' }, overflow: 'hidden', minWidth: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight={700} display="flex" alignItems="center" gap={1}>
                <History fontSize="small" color="secondary" /> Riwayat Broadcast (5 Terakhir)
              </Typography>
              <ToggleButtonGroup
                value={historyViewMode}
                exclusive
                onChange={(e, v) => v && handleHistoryViewModeChange(v)}
                size="small"
              >
                <ToggleButton value="table" size="small" sx={{ p: '6px 12px' }}>
                  <ViewList fontSize="small" />
                </ToggleButton>
                <ToggleButton value="grid" size="small" sx={{ p: '6px 12px' }}>
                  <ViewModule fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {histories.length === 0 ? (
              <Box p={3} textAlign="center" border="1px dashed" borderColor="divider" borderRadius={2}>
                <Typography variant="body2" color="text.secondary">Belum ada riwayat.</Typography>
              </Box>
            ) : historyViewMode === 'table' ? (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflowX: 'auto', width: '100%' }}>
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: 600 }}>
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: 'rgba(99, 102, 241, 0.04)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '2px solid', borderColor: 'divider' } }}>
                      <TableCell sx={{ width: '72px' }}>Tipe</TableCell>
                      <TableCell>Konten / Pertanyaan</TableCell>
                      <TableCell align="center" sx={{ width: '64px' }}>Target</TableCell>
                      <TableCell align="center" sx={{ width: '64px' }}>Sukses</TableCell>
                      <TableCell align="center" sx={{ width: '56px' }}>Gagal</TableCell>
                      <TableCell align="center" sx={{ width: '72px' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {histories.map(h => (
                      <TableRow key={h.id} hover sx={{ '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.02)' }, '& td': { fontSize: 13, borderBottomColor: 'rgba(0, 0, 0, 0.04)' }, transition: 'background 0.15s' }}>
                        <TableCell>
                          <Chip 
                            label={h.type.toUpperCase()} 
                            size="small" 
                            variant="filled" 
                            color={h.type === 'poll' ? 'secondary' : 'default'} 
                            sx={{ fontWeight: 600, fontSize: 10 }}
                          />
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            overflow: 'hidden', 
                            fontWeight: 500,
                            p: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              wordBreak: 'break-word',
                              '& p': { m: 0 },
                              '& ul, & ol': { m: 0, pl: 2 },
                              '& li': { m: 0 },
                              '& h1, & h2, & h3, & h4, & h5, & h6': { m: 0, fontSize: 'inherit', fontWeight: 'inherit' },
                            }}
                            dangerouslySetInnerHTML={{ __html: h.content }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>{h.total_target}</TableCell>
                        <TableCell align="center" sx={{ color: 'success.main', fontWeight: 600 }}>{h.sent}</TableCell>
                        <TableCell align="center" sx={{ color: h.failed > 0 ? 'error.main' : 'text.secondary', fontWeight: 600 }}>{h.failed}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={h.status} 
                            size="small" 
                            color={h.status === 'running' ? 'warning' : h.status === 'error' ? 'error' : 'success'} 
                            sx={{ fontWeight: 600, fontSize: 10, textTransform: 'capitalize' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Grid container spacing={{ xs: 1.5, md: 2 }}>
                {histories.map(h => {
                  const successRate = h.total_target > 0 ? (h.sent / h.total_target) * 100 : 0;
                  return (
                    <Grid item xs={12} sm={6} key={h.id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderRadius: 3, 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between', 
                          transition: 'all 0.2s', 
                          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: 'primary.main' } 
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                            <Chip 
                              label={h.type.toUpperCase()} 
                              size="small" 
                              color={h.type === 'poll' ? 'secondary' : 'default'} 
                              variant="outlined" 
                              sx={{ fontWeight: 600, fontSize: 10, borderRadius: 1.5 }} 
                            />
                            <Chip 
                              label={h.status} 
                              size="small" 
                              color={h.status === 'running' ? 'warning' : h.status === 'error' ? 'error' : 'success'} 
                              sx={{ fontWeight: 600, fontSize: 10, textTransform: 'capitalize' }} 
                            />
                          </Stack>
                          
                          <Typography
                            variant="body2"
                            component="div"
                            sx={{
                              fontWeight: 600,
                              mb: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              minHeight: 54,
                              lineHeight: 1.4,
                              '& p': { m: 0 },
                              '& h1, & h2, & h3, & h4, & h5, & h6': { m: 0, fontSize: 'inherit', fontWeight: 'inherit' }
                            }}
                            dangerouslySetInnerHTML={{ __html: h.content }}
                          />

                          <Box sx={{ mb: 1.5 }}>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                              <Typography variant="caption" color="text.secondary">Delivery Rate</Typography>
                              <Typography variant="caption" fontWeight={600} color="primary.main">{successRate.toFixed(0)}%</Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={successRate}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'rgba(0, 0, 0, 0.05)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  backgroundColor: h.status === 'error' ? 'error.main' : 'success.main'
                                }
                              }}
                            />
                          </Box>

                          <Divider sx={{ my: 1.5 }} />

                          <Grid container spacing={1} textAlign="center">
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary" display="block">Target</Typography>
                              <Typography variant="body2" fontWeight={700}>{h.total_target}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary" display="block">Sukses</Typography>
                              <Typography variant="body2" fontWeight={700} color="success.main">{h.sent}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary" display="block">Gagal</Typography>
                              <Typography variant="body2" fontWeight={700} color={h.failed > 0 ? 'error.main' : 'text.primary'}>{h.failed}</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
