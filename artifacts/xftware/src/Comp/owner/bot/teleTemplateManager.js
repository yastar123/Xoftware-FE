import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Chip,
  InputAdornment,
  Tabs,
  Tab,
  alpha,
  Divider,
} from '@mui/material';
import {
  Search,
  Save,
  Restore,
  SmartButton,
  Article,
  CheckCircle,
} from '@mui/icons-material';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';

export default function TeleTemplateManager() {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [resettingKey, setResettingKey] = useState(null);

  const [activeTab, setActiveTab] = useState('message'); // 'message' | 'keyboard'
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const [messages, setMessages] = useState([]);
  const [keyboards, setKeyboards] = useState([]);

  // Local draft edits: { [key]: string }
  const [drafts, setDrafts] = useState({});

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await reqOwner({ action: 'getTeleTemplates' });
      if (!res.error && res.data) {
        const msgs = res.data.messages || [];
        const kbds = res.data.keyboards || [];
        setMessages(msgs);
        setKeyboards(kbds);

        const initialDrafts = {};
        msgs.forEach((m) => {
          initialDrafts[m.key] = m.content || m.defaultContent || '';
        });
        kbds.forEach((k) => {
          initialDrafts[k.key] = k.content || k.defaultLayout || '';
        });
        setDrafts(initialDrafts);
      } else {
        toast.error(res.message || 'Gagal memuat template');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat template');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDraftChange = (key, val) => {
    setDrafts((prev) => ({ ...prev, [key]: val }));
  };

  const handleInsertPlaceholder = (key, textToInsert) => {
    setDrafts((prev) => {
      const current = prev[key] || '';
      return {
        ...prev,
        [key]: current ? `${current} ${textToInsert}` : textToInsert,
      };
    });
  };

  const handleSave = async (item) => {
    const key = item.key;
    const content = drafts[key] ?? item.content;

    if (!content.trim()) {
      return toast.warning('Konten template tidak boleh kosong');
    }

    setSavingKey(key);
    try {
      const res = await reqOwner({
        action: 'updateTeleTemplate',
        key,
        type: item.type,
        content,
      });

      if (!res.error) {
        toast.success(res.message || 'Template berhasil disimpan');
        // Update local state item
        if (item.type === 'keyboard') {
          setKeyboards((prev) =>
            prev.map((k) => (k.key === key ? { ...k, content, isCustom: true } : k))
          );
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.key === key ? { ...m, content, isCustom: true } : m))
          );
        }
      } else {
        toast.error(res.message || 'Gagal menyimpan template');
      }
    } catch {
      toast.error('Gagal menyimpan template');
    }
    setSavingKey(null);
  };

  const handleReset = async (item) => {
    const key = item.key;
    setResettingKey(key);
    try {
      const res = await reqOwner({
        action: 'resetTeleTemplate',
        key,
        type: item.type,
      });

      if (!res.error) {
        toast.success(res.message || 'Template berhasil direset ke default');
        const defaultVal = res.data?.content || (item.type === 'keyboard' ? item.defaultLayout : item.defaultContent);
        setDrafts((prev) => ({ ...prev, [key]: defaultVal }));

        if (item.type === 'keyboard') {
          setKeyboards((prev) =>
            prev.map((k) => (k.key === key ? { ...k, content: defaultVal, isCustom: false } : k))
          );
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.key === key ? { ...m, content: defaultVal, isCustom: false } : m))
          );
        }
      } else {
        toast.error(res.message || 'Gagal mereset template');
      }
    } catch {
      toast.error('Gagal mereset template');
    }
    setResettingKey(null);
  };

  // Helper to parse visual keyboard buttons for preview
  const parseKeyboardPreview = (layoutString) => {
    if (!layoutString) return [];
    return layoutString
      .split('\n')
      .map((line) => {
        const row = [];
        const regex = /\[(.*?)\]/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
          const content = match[1].trim();
          if (!content) continue;
          const parts = content.split('|');
          row.push({
            text: parts[0].trim(),
            action: parts.length > 1 ? parts.slice(1).join('|').trim() : '',
          });
        }
        return row;
      })
      .filter((row) => row.length > 0);
  };

  // Extract category list
  const currentList = activeTab === 'message' ? messages : keyboards;

  const categories = useMemo(() => {
    const set = new Set();
    currentList.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ['Semua', ...Array.from(set)];
  }, [currentList]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return currentList.filter((item) => {
      const matchCat =
        selectedCategory === 'Semua' || item.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [currentList, selectedCategory, search]);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 350, gap: 2 }}>
        <CircularProgress />
        <Typography color="text.disabled">Memuat katalog template Telegram...</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      {/* Header Info */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Kustomisasi Template & Tombol Telegram
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Kelola pesan bot dan tata letak tombol secara visual tanpa perlu mengatur lewat perintah chat /admin.
        </Typography>
      </Box>

      {/* Main Mode Tabs */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3, maxWidth: '100%', overflow: 'hidden' }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, maxWidth: '100%', minWidth: 0 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
            spacing={2}
            sx={{ width: '100%', minWidth: 0 }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, v) => {
                setActiveTab(v);
                setSelectedCategory('Semua');
              }}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 44,
                maxWidth: '100%',
                width: '100%',
                minWidth: 0,
                '& .MuiTabs-scroller': {
                  overflowX: 'auto !important',
                },
                '& .MuiTab-root': {
                  whiteSpace: 'nowrap',
                  minHeight: 44,
                  fontSize: { xs: 12.5, sm: 14 },
                  px: { xs: 1.5, sm: 2 },
                },
              }}
            >
              <Tab
                value="message"
                icon={<Article fontSize="small" />}
                iconPosition="start"
                label={`Template Pesan (${messages.length})`}
                sx={{ textTransform: 'none', fontWeight: 700, minHeight: 44 }}
              />
              <Tab
                value="keyboard"
                icon={<SmartButton fontSize="small" />}
                iconPosition="start"
                label={`Susunan Tombol (${keyboards.length})`}
                sx={{ textTransform: 'none', fontWeight: 700, minHeight: 44 }}
              />
            </Tabs>

            {/* Search Box */}
            <TextField
              size="small"
              placeholder="Cari nama atau kunci template..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: { xs: '100%', md: 300 },
                maxWidth: '100%',
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
          </Stack>

          {/* Category Chips */}
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              maxWidth: '100%',
              minWidth: 0,
              gap: 1,
              pb: 0.5,
              '&::-webkit-scrollbar': { height: 4 },
              '&::-webkit-scrollbar-thumb': { backgroundColor: 'divider', borderRadius: 2 },
            }}
          >
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                clickable
                color={selectedCategory === cat ? 'primary' : 'default'}
                variant={selectedCategory === cat ? 'filled' : 'outlined'}
                onClick={() => setSelectedCategory(cat)}
                sx={{ fontWeight: 600, fontSize: 13, flexShrink: 0 }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card sx={{ borderRadius: 3, border: '1px dashed', borderColor: 'divider', p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Tidak ada template yang cocok dengan filter atau pencarian Anda.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={3}>
          {filteredItems.map((item) => {
            const currentVal = drafts[item.key] ?? item.content;
            const isCustom = !!item.isCustom;
            const isSaving = savingKey === item.key;
            const isResetting = resettingKey === item.key;
            const keyboardRows = item.type === 'keyboard' ? parseKeyboardPreview(currentVal) : [];

            return (
              <Card
                key={item.key}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: isCustom ? alpha('#6366f1', 0.4) : 'divider',
                  boxShadow: isCustom ? '0 4px 16px -8px rgba(99, 102, 241, 0.15)' : 'none',
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', minWidth: 0 }}>
                  <Stack spacing={2.5}>
                    {/* Header Item */}
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={1}
                      sx={{ width: '100%', minWidth: 0 }}
                    >
                      <Box sx={{ width: '100%', minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                          <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: 16, sm: 18 }, wordBreak: 'break-word' }}>
                            {item.title}
                          </Typography>
                          <Chip
                            label={item.category}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 11, fontWeight: 600 }}
                          />
                          <Chip
                            label={isCustom ? 'Kustom' : 'Default'}
                            size="small"
                            color={isCustom ? 'primary' : 'default'}
                            icon={isCustom ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : undefined}
                            sx={{ fontSize: 11, fontWeight: 700 }}
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                          Kunci: <code>{item.key}</code>
                        </Typography>
                      </Box>

                      {/* Reset Button */}
                      <Button
                        size="small"
                        variant="text"
                        color="inherit"
                        disabled={!isCustom || isResetting || isSaving}
                        onClick={() => handleReset(item)}
                        startIcon={isResetting ? <CircularProgress size={14} /> : <Restore fontSize="small" />}
                        sx={{ textTransform: 'none', fontSize: 12, color: 'text.secondary' }}
                      >
                        Reset ke Default
                      </Button>
                    </Stack>

                    {/* Description */}
                    {item.description && (
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    )}

                    {/* Format Guide */}
                    {item.type === 'message' ? (
                      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                        Format teks Telegram: <code>*tebal*</code>, <code>_miring_</code>, <code>`mono`</code>, <code>~coret~</code>.
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                        Format tombol: Gunakan kurung siku <code>[ Teks Tombol | Aksi/Alias ]</code> per baris.
                      </Typography>
                    )}

                    {/* Clickable Variable / Alias Chips */}
                    {item.type === 'message' && item.variables && item.variables.length > 0 && (
                      <Box>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
                          Variabel yang dapat dipakai:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                          {item.variables.map((v) => (
                            <Chip
                              key={v}
                              label={`{{${v}}}`}
                              size="small"
                              clickable
                              onClick={() => handleInsertPlaceholder(item.key, `{{${v}}}`)}
                              sx={{ fontFamily: 'monospace', fontSize: 11 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {item.type === 'keyboard' && (
                      <Box>
                        {item.actionAliases && item.actionAliases.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
                              Alias Aksi Tombol:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                              {item.actionAliases.map((alias) => (
                                <Chip
                                  key={alias}
                                  label={`[ Tombol | ${alias} ]`}
                                  size="small"
                                  clickable
                                  onClick={() => handleInsertPlaceholder(item.key, `[ Tombol | ${alias} ]`)}
                                  sx={{ fontFamily: 'monospace', fontSize: 11 }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        {item.dynamicVariables && item.dynamicVariables.length > 0 && (
                          <Box>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
                              Variabel Dinamis:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                              {item.dynamicVariables.map((dyn) => (
                                <Chip
                                  key={dyn}
                                  label={`{{${dyn}}}`}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                  clickable
                                  onClick={() => handleInsertPlaceholder(item.key, `{{${dyn}}}`)}
                                  sx={{ fontFamily: 'monospace', fontSize: 11 }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Textarea Editor */}
                    <TextField
                      value={currentVal}
                      onChange={(e) => handleDraftChange(item.key, e.target.value)}
                      fullWidth
                      multiline
                      rows={item.type === 'keyboard' ? 5 : 7}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontFamily: 'monospace',
                          fontSize: 13,
                          lineHeight: 1.6,
                        },
                      }}
                    />

                    {/* Visual Simulator for Keyboard */}
                    {item.type === 'keyboard' && keyboardRows.length > 0 && (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha('#6366f1', 0.04),
                          border: '1px dashed',
                          borderColor: alpha('#6366f1', 0.2),
                        }}
                      >
                        <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ display: 'block', mb: 1.5 }}>
                          Simulasi Tata Letak Tombol:
                        </Typography>
                        <Stack spacing={1}>
                          {keyboardRows.map((row, rIdx) => (
                            <Stack key={rIdx} direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                              {row.map((btn, bIdx) => (
                                <Box
                                  key={bIdx}
                                  sx={{
                                    flex: 1,
                                    minWidth: 100,
                                    py: 1,
                                    px: 1.5,
                                    borderRadius: 1.5,
                                    bgcolor: 'background.paper',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    textAlign: 'center',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                  }}
                                >
                                  <Typography variant="body2" fontWeight={600} noWrap>
                                    {btn.text}
                                  </Typography>
                                  {btn.action && (
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 10 }}>
                                      {btn.action}
                                    </Typography>
                                  )}
                                </Box>
                              ))}
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Actions */}
                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                      <Button
                        variant="contained"
                        onClick={() => handleSave(item)}
                        disabled={isSaving || isResetting}
                        startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
                      >
                        Simpan Perubahan
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
