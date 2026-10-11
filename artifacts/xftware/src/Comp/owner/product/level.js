import {
  Box, Card, CardContent, Typography, Stack, Button, Divider, TextField, Alert,
  IconButton, CircularProgress, Tabs, Tab, Table, TableHead, TableRow, TableCell,
  TableBody, MenuItem, Select, InputLabel, FormControl, Chip, TableContainer,
  Pagination, Skeleton, alpha, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Tooltip, useTheme
} from '@mui/material';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import WarningIcon from '@mui/icons-material/Warning';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { idr } from '@/lib/helper';
import { WorkspacePremium } from '@mui/icons-material';

/* ================================================================
   SHARED: Confirm Dialog
   ================================================================ */
function ConfirmDialog({ open, title, message, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', confirmColor = 'error', onConfirm, onCancel, loading }) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" fontSize="small" />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading} size="small" sx={{ borderRadius: 2, textTransform: 'none' }}>{cancelText}</Button>
        <Button
          onClick={onConfirm} color={confirmColor} variant="contained"
          disabled={loading} size="small"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function LevelManagementPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  // level owner
  const [allLevels, setAllLevels] = useState([]);
  const [selectedLevelName, setSelectedLevelName] = useState('');
  const [levelOwnerConfig, setLevelOwnerConfig] = useState(null);
  const [levelOwnerLoading, setLevelOwnerLoading] = useState(false);
  const [showLevelEditor, setShowLevelEditor] = useState(false);

  const [levelProfit, setLevelProfit] = useState('');
  const [levelPrice, setLevelPrice] = useState('');
  const [levelDesc, setLevelDesc] = useState('');
  const [savingLevelOwner, setSavingLevelOwner] = useState(false);
  const [resettingLevelOwner, setResettingLevelOwner] = useState(false);
  const [confirmResetOwner, setConfirmResetOwner] = useState(false);

  // tab
  const [tab, setTab] = useState('user');

  // management user
  const [userList, setUserList] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userFilter, setUserFilter] = useState('createdAtLevel');
  const [userSearch, setUserSearch] = useState('');
  const [userLevelFilter, setUserLevelFilter] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [levelOptions, setLevelOptions] = useState([]);
  const [savingUserLevelId, setSavingUserLevelId] = useState(null);
  const [resettingUserLevelId, setResettingUserLevelId] = useState(null);
  const [confirmResetUser, setConfirmResetUser] = useState(null);

  // riwayat level user
  const [historyList, setHistoryList] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyReffId, setHistoryReffId] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  // stats
  const statsData = {
    totalUsers: userList.length,
    totalLevels: allLevels.length,
    totalHistory: historyList.length,
  };

  // init
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([fetchLevelOwner(), fetchLevelNames(), fetchUserLevels(1, userFilter, userSearch, userLevelFilter), fetchRiwayatLevelUser(1)]);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUserLevels(userPage, userFilter, userSearch, userLevelFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPage, userFilter, userLevelFilter]);

  useEffect(() => {
    fetchRiwayatLevelUser(historyPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyPage]);

  const fetchLevelOwner = async () => {
    setLevelOwnerLoading(true);
    try {
      const res = await reqOwner({ action: 'getLevelOwner' });
      if (res.error) return toast.error(res.message);
      const config = res.data || null;
      setLevelOwnerConfig(config);
      if (config && config.configownerlevel) {
        setLevelProfit(config.configownerlevel.profit ?? '');
        setLevelPrice(config.configownerlevel.price ?? '');
        setLevelDesc(config.configownerlevel.desc ?? '');
      }
    } catch {
      toast.error('Gagal mengambil konfigurasi level owner');
    } finally {
      setLevelOwnerLoading(false);
    }
  };

  const fetchLevelNames = async () => {
    try {
      const res = await reqOwner({ action: 'getLevelList' });
      if (res.error) return toast.error(res.message);
      const levels = res.data || [];
      setAllLevels(levels);
      if (levels.length > 0) {
        const first = levels[0];
        const firstName = first.level_name || first.levelName || first.configlevel?.level_name || '';
        setSelectedLevelName(firstName);
        if (first.configownerlevel) {
          setLevelProfit(first.configownerlevel.profit ?? '');
          setLevelPrice(first.configownerlevel.price ?? '');
          setLevelDesc(first.configownerlevel.desc ?? '');
        } else {
          setLevelProfit('');
          setLevelPrice('');
          setLevelDesc('');
        }
      }
    } catch {
      toast.error('Gagal mengambil data level owner');
    }
  };

  const handleChangeSelectedLevel = value => {
    setSelectedLevelName(value);
    const found = allLevels.find(lv => lv.level_name === value || lv.levelName === value || lv.configlevel?.level_name === value);
    if (found && found.configownerlevel) {
      setLevelProfit(found.configownerlevel.profit ?? '');
      setLevelPrice(found.configownerlevel.price ?? '');
      setLevelDesc(found.configownerlevel.desc ?? '');
    } else {
      setLevelProfit('');
      setLevelPrice('');
      setLevelDesc('');
    }
  };

  const handleSaveLevelOwner = async () => {
    if (!selectedLevelName) return toast.error('Pilih level terlebih dahulu');
    setSavingLevelOwner(true);
    try {
      const res = await reqOwner({
        action: 'editLevelOwner',
        levelName: selectedLevelName,
        profit: levelProfit,
        price: levelPrice,
        desc: levelDesc,
      });
      if (res.error) return toast.error(res.message);
      toast.success(res.message || 'Berhasil menyimpan pengaturan level owner');
      fetchLevelOwner();
      fetchLevelNames();
    } catch {
      toast.error('Gagal menyimpan pengaturan level owner');
    } finally {
      setSavingLevelOwner(false);
    }
  };

  const handleResetLevelOwner = async () => {
    setResettingLevelOwner(true);
    try {
      const res = await reqOwner({ action: 'resetLevelOwner' });
      if (res.error) return toast.error(res.message);
      toast.success(res.message || 'Berhasil reset pengaturan level owner');
      fetchLevelOwner();
      fetchLevelNames();
    } catch {
      toast.error('Gagal reset pengaturan level owner');
    } finally {
      setResettingOwner(false);
      setConfirmResetOwner(false);
    }
  };

  const fetchUserLevels = async (page, filter, search, level) => {
    setUserLoading(true);
    try {
      const res = await reqOwner({
        action: 'getLevelUser',
        page,
        filter,
        search,
        level: level?.id || '',
      });
      if (res.error) return toast.error(res.message);
      setUserList(res.data.data || []);
      setUserTotalPages(res.data.totalPages || 1);
    } catch {
      toast.error('Gagal memuat data user level');
    } finally {
      setUserLoading(false);
    }
  };

  const fetchLevelOptions = async () => {
    try {
      const res = await reqOwner({ action: 'getLevelNames' });
      if (res.error) return toast.error(res.message);
      setLevelOptions(res.data || []);
    } catch {
      toast.error('Gagal memuat daftar level');
    }
  };

  const handleUpdateUserLevel = async (userId, levelOwnerId) => {
    if (!levelOwnerId) return toast.error('Pilih level terlebih dahulu');
    setSavingUserLevelId(userId);
    try {
      const res = await reqOwner({ action: 'editLevelUser', userId, levelOwnerId });
      if (res.error) return toast.error(res.message);
      toast.success(res.message || 'Berhasil mengupdate level user');
      fetchUserLevels(userPage, userFilter, userSearch, userLevelFilter);
    } catch {
      toast.error('Gagal mengupdate level user');
    } finally {
      setSavingUserLevelId(null);
    }
  };

  const handleResetUserLevel = async () => {
    if (!confirmResetUser) return;
    setResettingUserLevelId(confirmResetUser);
    try {
      const res = await reqOwner({ action: 'resetLevelUser', userId: confirmResetUser });
      if (res.error) return toast.error(res.message);
      toast.success(res.message || 'Berhasil reset level user');
      fetchUserLevels(userPage, userFilter, userSearch, userLevelFilter);
    } catch {
      toast.error('Gagal reset level user');
    } finally {
      setResettingUserLevelId(null);
      setConfirmResetUser(null);
    }
  };

  const fetchRiwayatLevelUser = async page => {
    setHistoryLoading(true);
    try {
      const body = { action: 'getRiwayatLevelUser', page };
      if (historyStartDate && historyEndDate) { body.startDate = historyStartDate; body.endDate = historyEndDate; }
      if (historyReffId) body.reffId = historyReffId;
      const res = await reqOwner(body);
      if (res.error) return toast.error(res.message);
      setHistoryList(res.data.rows || []);
      setHistoryTotalPages(res.data.totalPage || 1);
    } catch {
      toast.error('Gagal memuat riwayat level user');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSearchHistory = () => {
    setHistoryPage(1);
    fetchRiwayatLevelUser(1);
  };

  useEffect(() => { fetchLevelOptions(); }, []);

  if (loading) {
    return (
      <Box>
        <Stack spacing={2}>{[...Array(6)].map((_, i) => <Skeleton key={i} variant="rectangular" height={44} sx={{ borderRadius: 2 }} />)}</Stack>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <WorkspacePremiumIcon sx={{ fontSize: 24, color: '#6366f1' }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>Pengaturan Level</Typography>
          <Typography variant="caption" color="text.secondary">Konfigurasi level owner, manajemen user, dan riwayat perubahan</Typography>
        </Box>
      </Stack>

      {/* Stats Bar */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {[
          { label: 'Total Level', value: allLevels.length, icon: <WorkspacePremiumIcon sx={{ fontSize: 18 }} /> },
          { label: 'User Dikelola', value: userList.length, icon: <PeopleIcon sx={{ fontSize: 18 }} /> },
          { label: 'Total Riwayat', value: historyList.length, icon: <HistoryIcon sx={{ fontSize: 18 }} /> },
        ].map((s, i) => (
          <Grid item xs={6} sm={4} key={i}>
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>{s.icon}</Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{s.label}</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>{s.value.toLocaleString('id-ID')}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Card */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {showLevelEditor ? 'Editor Level Owner' : 'Manajemen Level'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {showLevelEditor ? 'Ubah konfigurasi harga, profit, dan deskripsi level' : 'Kelola level user dan pantau riwayat perubahan'}
              </Typography>
            </Box>
            <Button
              variant={showLevelEditor ? 'outlined' : 'contained'}
              startIcon={showLevelEditor ? <CloseIcon sx={{ fontSize: 16 }} /> : <SettingsIcon sx={{ fontSize: 16 }} />}
              onClick={() => setShowLevelEditor(prev => !prev)}
              sx={{ borderRadius: 2, textTransform: 'none', px: 2.5 }}
            >
              {showLevelEditor ? 'Tutup' : 'Pengaturan Owner'}
            </Button>
          </Stack>

          <AnimatePresence initial={false}>
            {showLevelEditor && (
              <motion.div
                key="level-editor"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    borderStyle: 'dashed',
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(16,185,129,0.04))'
                      : 'linear-gradient(135deg, rgba(99,102,241,0.03), rgba(16,185,129,0.03))',
                  }}
                >
                  <CardContent>
                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                      Gunakan form ini untuk mengubah konfigurasi level owner. Perubahan berlaku global.
                    </Alert>

                    <Stack spacing={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Pilih Level</InputLabel>
                        <Select value={selectedLevelName} label="Pilih Level" onChange={e => handleChangeSelectedLevel(e.target.value)} sx={{ borderRadius: 2 }}>
                          {allLevels.map(lv => {
                            const name = lv.level_name || lv.levelName || lv.configlevel?.level_name || '-';
                            return <MenuItem key={lv.id || name} value={name}>{name}</MenuItem>;
                          })}
                        </Select>
                      </FormControl>

                      <Grid container spacing={1.5}>
                        <Grid item xs={12} md={6}>
                          <TextField label="Profit / Bagi Hasil (%)" value={levelProfit} onChange={e => setLevelProfit(e.target.value)} fullWidth type="number" size="small" inputProps={{ min: 0, max: 100 }} sx={{ borderRadius: 2 }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField label="Harga Level (jika ada)" value={levelPrice} onChange={e => setLevelPrice(e.target.value)} fullWidth type="number" size="small" inputProps={{ min: 0 }} sx={{ borderRadius: 2 }} />
                        </Grid>
                      </Grid>

                      <TextField label="Deskripsi Level Owner" value={levelDesc} onChange={e => setLevelDesc(e.target.value)} fullWidth multiline minRows={3} size="small" sx={{ borderRadius: 2 }} />

                      <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                        <Button
                          variant="outlined" color="error"
                          startIcon={resettingLevelOwner ? <CircularProgress size={14} color="inherit" /> : <FaTrash />}
                          onClick={() => setConfirmResetOwner(true)}
                          disabled={resettingLevelOwner}
                          sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                          Reset
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={savingLevelOwner ? <CircularProgress size={14} color="inherit" /> : <FaEdit />}
                          onClick={handleSaveLevelOwner}
                          disabled={savingLevelOwner}
                          sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                          Simpan
                        </Button>
                      </Stack>
                    </Stack>

                    {/* Level Cards Preview */}
                    {levelOwnerLoading ? (
                      <Stack spacing={2} sx={{ mt: 3 }}>
                        {[...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={110} animation="wave" sx={{ borderRadius: 2.5 }} />)}
                      </Stack>
                    ) : levelOwnerConfig?.filter(s => s.configownerlevels?.[0]).length === 0 ? (
                      <Box textAlign="center" py={5}>
                        <WorkspacePremiumIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.disabled">Belum ada konfigurasi level</Typography>
                      </Box>
                    ) : (
                      <motion.div variants={staggerContainer} initial="hidden" animate="show" sx={{ mt: 3 }}>
                        {levelOwnerConfig
                          ?.filter(c => c.configownerlevels?.[0])
                          .map(lvl => (
                            <motion.div key={lvl.id} variants={staggerItem}>
                              <LevelCard level={lvl} />
                            </motion.div>
                          ))}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!showLevelEditor && (
              <motion.div
                key="tabs-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v)}
                  sx={{
                    mb: 2.5,
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: 13 },
                    '& .Mui-selected': { fontWeight: 700, color: '#4338ca' },
                    '& .MuiTabs-indicator': { backgroundColor: '#4338ca', height: 3, borderRadius: 3 },
                  }}
                  variant="scrollable"
                  allowScrollButtonsMobile
                >
                  <Tab icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Manajemen User" value="user" />
                  <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Riwayat Level" value="history" />
                </Tabs>

                <AnimatePresence mode="wait">
                  {tab === 'user' ? (
                    <motion.div key="user-tab" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                      <UserManagementSection
                        userList={userList} userPage={userPage} setUserPage={setUserPage}
                        userTotalPages={userTotalPages} userFilter={userFilter} setUserFilter={setUserFilter}
                        userSearch={userSearch} setUserSearch={setUserSearch}
                        userLevelFilter={userLevelFilter} setUserLevelFilter={setUserLevelFilter}
                        userLoading={userLoading} levelOptions={levelOptions}
                        savingUserLevelId={savingUserLevelId} resettingUserLevelId={resettingUserLevelId}
                        onSearch={() => { setUserPage(1); fetchUserLevels(1, userFilter, userSearch, userLevelFilter); }}
                        onUpdateUserLevel={handleUpdateUserLevel}
                        onResetUserLevel={setConfirmResetUser}
                      />
                    </motion.div>
                  ) : (
                    <motion.div key="history-tab" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                      <HistorySection
                        historyList={historyList} historyPage={historyPage} setHistoryPage={setHistoryPage}
                        historyTotalPages={historyTotalPages}
                        historyStartDate={historyStartDate} historyEndDate={historyEndDate}
                        historyReffId={historyReffId}
                        setHistoryStartDate={setHistoryStartDate} setHistoryEndDate={setHistoryEndDate}
                        setHistoryReffId={setHistoryReffId}
                        historyLoading={historyLoading} onSearch={handleSearchHistory}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Confirm: Reset Level Owner */}
      <ConfirmDialog
        open={confirmResetOwner}
        title="Reset Pengaturan Level Owner"
        message="Apakah Anda yakin ingin mereset semua pengaturan level owner?\n\nTindakan ini tidak dapat dibatalkan."
        onConfirm={handleResetLevelOwner}
        onCancel={() => setConfirmResetOwner(false)}
        loading={resettingLevelOwner}
      />

      {/* Confirm: Reset User Level */}
      <ConfirmDialog
        open={!!confirmResetUser}
        title="Reset Level User"
        message="Apakah Anda yakin ingin mereset level user ini?\n\nUser akan dikembalikan ke level default."
        onConfirm={handleResetUserLevel}
        onCancel={() => setConfirmResetUser(null)}
        loading={!!resettingUserLevelId}
      />
    </Box>
  );
}

function LevelCard({ level }) {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        mb: 2,
        overflow: 'hidden',
        position: 'relative',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #151515, #202020)'
          : 'linear-gradient(135deg, #ffffff, #f7f9ff)',
        border: `1px solid ${alpha('#6366f1', 0.08)}`,
        transition: 'transform .25s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: alpha('#6366f1', 0.2),
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute', top: -20, right: -20,
          width: 70, height: 70, borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#6366f1', 0.1)}, transparent 70%)`,
        }}
      />
      <CardContent sx={{ position: 'relative', zIndex: 1, py: 2, px: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: alpha('#6366f1', 0.08),
              color: '#6366f1', flexShrink: 0,
            }}
          >
            {level.iconlevel
              ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={level.iconlevel} alt="icon level" style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
                </>
              )
              : <WorkspacePremium sx={{ fontSize: 24 }} />}
          </Box>
          <Box flex={1}>
            <Typography fontWeight={700} fontSize={{ xs: 14, sm: 15 }}>{level.level_name || 'Level'}</Typography>
            <Typography fontSize={12} color="text.secondary" mt={0.3} sx={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
              {level?.configownerlevels?.[0]?.desc || 'Tidak ada deskripsi level.'}
            </Typography>
            <Box mt={1}>
              <Typography fontSize={{ xs: 17, sm: 19 }} fontWeight={800} color="#6366f1">
                {idr(level?.configownerlevels?.[0]?.price || 0)}
              </Typography>
              {level?.configownerlevels?.[0]?.profit != null && (
                <Typography variant="caption" color="text.secondary">
                  Profit: {level.configownerlevels[0].profit}%
                </Typography>
              )}
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const TABLE_HEAD_SX = {
  '& th': {
    bgcolor: alpha('#6366f1', 0.04),
    fontWeight: 600, fontSize: '0.75rem',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    color: '#64748B',
    borderBottom: '2px solid',
    borderColor: 'divider',
    whiteSpace: 'nowrap',
  },
};
const TABLE_ROW_SX = {
  '&:hover': { bgcolor: alpha('#6366f1', 0.02) },
  '& td': { fontSize: 13, borderBottomColor: alpha('#000', 0.04) },
  transition: 'background 0.15s',
};

function UserManagementSection(props) {
  const {
    userList, userPage, setUserPage, userTotalPages,
    userFilter, setUserFilter, userSearch, setUserSearch,
    userLevelFilter, setUserLevelFilter, userLoading, levelOptions,
    savingUserLevelId, resettingUserLevelId,
    onSearch, onUpdateUserLevel, onResetUserLevel,
  } = props;

  return (
    <Stack spacing={2}>
      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
        <TextField
          size="small" placeholder="Cari user (nama / sender)"
          value={userSearch} onChange={e => setUserSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
          }}
          sx={{ flex: 1, maxWidth: { sm: 300 }, borderRadius: 2 }}
        />
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Filter</InputLabel>
          <Select label="Filter" value={userFilter} onChange={e => setUserFilter(e.target.value)} sx={{ borderRadius: 2 }}>
            <MenuItem value="createdAtLevel">Terbaru dibuat</MenuItem>
            <MenuItem value="updateAtLevel">Terbaru diupdate</MenuItem>
            <MenuItem value="nameAsc">Nama A-Z</MenuItem>
            <MenuItem value="nameDesc">Nama Z-A</MenuItem>
            <MenuItem value="groupTelegram">Group Telegram</MenuItem>
            <MenuItem value="groupWhatsApp">Group WhatsApp</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Filter Level</InputLabel>
          <Select label="Filter Level" value={userLevelFilter?.level_name || ''} onChange={e => setUserLevelFilter(levelOptions.find(lv => lv.level_name == e.target.value))} displayEmpty sx={{ borderRadius: 2 }}>
            <MenuItem value=""><em>Semua level</em></MenuItem>
            {levelOptions.map(lv => (
              <MenuItem key={lv.id} value={lv.level_name}>{lv.level_name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={onSearch} sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>Cari</Button>
      </Stack>

      {/* Table */}
      <TableContainer component={Card} sx={{ borderRadius: 3, overflow: 'auto'}}>
        <Table size="small" sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={TABLE_HEAD_SX}>
              <TableCell align="center">ID</TableCell>
              <TableCell>Nama</TableCell>
              <TableCell align="center">Sender</TableCell>
              <TableCell align="center">Group</TableCell>
              <TableCell align="center">Level Saat Ini</TableCell>
              <TableCell align="center">Ubah Level</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userLoading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={`sk-${i}`}>{Array(7).fill(0).map((__, j) => <TableCell key={j} align="center"><Skeleton variant="text" width="70%" height={18} /></TableCell>)}</TableRow>
              ))
            ) : userList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Stack alignItems="center" spacing={1}>
                    <PeopleIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                    <Typography color="text.disabled">Tidak ada data user</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : userList.map(u => {
              const userLevel = (u.userlevels && u.userlevels[0]) || null;
              const ownerLevel = userLevel?.configownerlevel || null;
              const currentLevelName = ownerLevel?.configlevel?.level_name || '-';
              return (
                <TableRow key={u.id} hover sx={TABLE_ROW_SX}>
                  <TableCell align="center"><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>{u.id}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={500}>{u.name || '-'}</Typography></TableCell>
                  <TableCell align="center"><Typography variant="body2">{u.sender || '-'}</Typography></TableCell>
                  <TableCell align="center">
                    <Chip label={u.group || '-'} size="small" color={u.group === 'telegram' ? 'primary' : u.group === 'whatsapp' ? 'success' : 'default'} sx={{ fontSize: 11, height: 22, borderRadius: 1.5 }} />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={currentLevelName} size="small" variant="outlined" color="primary" sx={{ fontSize: 11, height: 22, borderRadius: 1.5, fontWeight: 600 }} />
                  </TableCell>
                  <TableCell align="center">
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select displayEmpty value={ownerLevel?.id || ''} onChange={e => onUpdateUserLevel(u.id, e.target.value)} disabled={savingUserLevelId === u.id} sx={{ borderRadius: 1.5, fontSize: 12, '& .MuiSelect-select': { py: 0.75 } }}>
                        <MenuItem value=""><em>Pilih level</em></MenuItem>
                        {levelOptions.map(lv => (
                          <MenuItem key={lv.id} value={lv.id}>{lv.configlevel?.level_name || lv.level_name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Reset level user">
                      <IconButton size="small" color="error" onClick={() => onResetUserLevel(u.id)} disabled={resettingUserLevelId === u.id}>
                        {resettingUserLevelId === u.id ? <CircularProgress size={16} /> : <FaTrash size={14} />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {userTotalPages > 1 && (
        <Stack direction="row" justifyContent="center" mt={2}>
          <Pagination count={userTotalPages} page={userPage} onChange={(_, v) => setUserPage(v)} color="primary" shape="rounded" size="small" />
        </Stack>
      )}
    </Stack>
  );
}

function HistorySection(props) {
  const {
    historyList, historyPage, setHistoryPage, historyTotalPages,
    historyStartDate, historyEndDate, historyReffId,
    setHistoryStartDate, setHistoryEndDate, setHistoryReffId,
    historyLoading, onSearch,
  } = props;

  return (
    <Stack spacing={2}>
      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
        <TextField label="Tanggal Mulai" type="date" size="small" value={historyStartDate} onChange={e => setHistoryStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ borderRadius: 2 }} />
        <TextField label="Tanggal Akhir" type="date" size="small" value={historyEndDate} onChange={e => setHistoryEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ borderRadius: 2 }} />
        <TextField label="Reff ID" size="small" placeholder="opsional" value={historyReffId} onChange={e => setHistoryReffId(e.target.value)} sx={{ flex: 1, maxWidth: { sm: 200 }, borderRadius: 2 }} />
        <Button variant="contained" onClick={onSearch} sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>Filter</Button>
      </Stack>

      {/* Table */}
      <TableContainer component={Card} sx={{ borderRadius: 3, overflow: 'auto'}}>
        <Table size="small" sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow sx={TABLE_HEAD_SX}>
              <TableCell align="center">ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell align="center">Sender</TableCell>
              <TableCell align="center">Group</TableCell>
              <TableCell align="center">Level Lama</TableCell>
              <TableCell align="center">Level Baru</TableCell>
              <TableCell align="center">Reff ID</TableCell>
              <TableCell align="center">Tanggal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historyLoading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={`sk-${i}`}>{Array(8).fill(0).map((__, j) => <TableCell key={j} align="center"><Skeleton variant="text" width="70%" height={18} /></TableCell>)}</TableRow>
              ))
            ) : historyList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Stack alignItems="center" spacing={1}>
                    <HistoryIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                    <Typography color="text.disabled">Tidak ada data riwayat</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : historyList.map(h => {
              const user = h.user || {};
              const payment = h.payment || {};
              return (
                <TableRow key={h.id} hover sx={TABLE_ROW_SX}>
                  <TableCell align="center"><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>{h.id}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={500}>{user.name || '-'}</Typography></TableCell>
                  <TableCell align="center"><Typography variant="body2">{user.sender || '-'}</Typography></TableCell>
                  <TableCell align="center">
                    <Chip label={user.group || '-'} size="small" color={user.group === 'telegram' ? 'primary' : user.group === 'whatsapp' ? 'success' : 'default'} sx={{ fontSize: 11, height: 22, borderRadius: 1.5 }} />
                  </TableCell>
                  <TableCell align="center"><Typography variant="body2" color="text.secondary">{h.level_before || '-'}</Typography></TableCell>
                  <TableCell align="center">
                    <Chip label={h.level_after || '-'} size="small" color="success" variant="outlined" sx={{ fontSize: 11, height: 22, borderRadius: 1.5, fontWeight: 600 }} />
                  </TableCell>
                  <TableCell align="center"><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{payment.reff_id || '-'}</Typography></TableCell>
                  <TableCell align="center"><Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>{h.createdAt ? new Date(h.createdAt).toLocaleString() : '-'}</Typography></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {historyTotalPages > 1 && (
        <Stack direction="row" justifyContent="center" mt={2}>
          <Pagination count={historyTotalPages} page={historyPage} onChange={(_, v) => setHistoryPage(v)} color="primary" shape="rounded" size="small" />
        </Stack>
      )}
    </Stack>
  );
}