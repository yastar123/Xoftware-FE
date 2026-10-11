import Config from '@/config';
import React, { useEffect, useState, startTransition } from 'react';
import { Box, Button, IconButton, Stack, TextField, Typography, CircularProgress } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { reqApiHttp, reqCheckSession } from '@/lib/requestApi';
import { ArrowBack } from '@mui/icons-material';
import TurnstileBox from '@/Comp/TurnstileBox';
import { useSocket } from '@/Context/SocketContext';

// CSR Auth check moved to LoginPage component
const SettingAuth = ({ onSuccess, onRequestSetup, mode = 'setup', secretCode: propSecret, qrImage: propQr }) => {
  const [qrImage, setQrImage] = useState(propQr || null);
  const [secretCode, setSecretCode] = useState(propSecret || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [hasStarted, setHasStarted] = useState(!!(propQr && propSecret));

  const handleStart = async () => {
    if (!onRequestSetup) return toast.error('Tidak dapat memulai setup saat ini');
    setLoading(true);
    const ok = await onRequestSetup();
    setLoading(false);
    if (!ok) return;
  };

  useEffect(() => {
    startTransition(() => {
      if (propQr) setQrImage(propQr);
      if (propSecret) setSecretCode(propSecret);
      if (propQr && propSecret) setHasStarted(true);
    });
  }, [propQr, propSecret]);

  const handleVerify = () => {
    if (!code || code.length !== 6) return toast.error('Kode harus 6 digit');
    if (onSuccess) onSuccess(code, secretCode);
  };

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <CircularProgress />
        <Typography mt={2}>Mengambil data 2FA...</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      <Typography textAlign="center" fontWeight="bold">
        {mode === 'force' ? 'Aktifkan Google Authenticator terlebih dahulu untuk lanjut' : 'Aktifkan fitur Google Authenticator (2FA) untuk meningkatkan keamanan'}
      </Typography>

      {!hasStarted ? (
        <Button variant="contained" onClick={handleStart}>
          Mulai Setup 2FA
        </Button>
      ) : (
        <>
          <Box component="img" src={qrImage} alt="QR Code Authenticator" width={200} height={200} sx={{ border: '1px solid #ddd', borderRadius: 2 }} />
          <Typography variant="caption" color="gray">
            Atau masukkan manual: <b>{secretCode}</b>
          </Typography>
          <TextField
            label="Kode OTP dari Google Authenticator"
            value={code}
            onChange={e => setCode(e.target.value)}
            inputProps={{ maxLength: 6 }}
            fullWidth
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleVerify();
              }
            }}
          />
          <Button variant="contained" onClick={handleVerify} disabled={verifying} fullWidth>
            {verifying ? 'Verifikasi...' : 'Aktifkan & Simpan'}
          </Button>
        </>
      )}
    </Box>
  );
};

// ==========================================
// COMPONENT: ForgotPasswordFlow
// ==========================================
const ForgotPasswordFlow = ({ onBack, onSwitchToLogin }) => {
  const [step, setStep] = useState(0); // 0: Input Email, 1: Verifikasi & Password
  const [email, setEmail] = useState('');
  const [tsToken, setTsToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false); // Penanda apakah user punya 2FA aktif
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confPass, setConfPass] = useState('');

  const handleRequestReset = async () => {
    if (!email) return toast.error('Masukkan email');
    if (!tsToken) return toast.error('Selesaikan verifikasi captcha');

    setIsLoading(true);
    const res = await reqApiHttp('/owner/auth/forgot-password/request', { email, token: tsToken });
    setIsLoading(false);

    if (res.error) return toast.error(res.message);

    // Jika server meminta 2FA
    if (res.data?.requires2FA) {
      setRequires2FA(true);
      toast.info('Akun Anda terproteksi 2FA. Masukkan kode Authenticator.');
    } else {
      setRequires2FA(false);
      toast.success('Kode OTP telah dikirim ke email Anda.');
    }
    setStep(1);
  };

  const handleVerifyAndReset = async () => {
    if (!code) return toast.error('Masukkan kode verifikasi');
    if (!newPass || !confPass) return toast.error('Masukkan password baru');
    if (newPass !== confPass) return toast.error('Konfirmasi password tidak cocok');

    setIsLoading(true);
    const res = await reqApiHttp('/owner/auth/forgot-password/action', { email, otpCode: code, newPassword: newPass, confirmPassword: confPass });
    setIsLoading(false);

    if (res.error) return toast.error(res.message);

    toast.success('Password berhasil direset! Silakan login.');
    onSwitchToLogin(); // Kembali ke halaman login
  };

  return (
    <Stack spacing={2}>
      {step === 0 && (
        <>
          <Typography variant="h5" fontWeight="bold" textAlign="center">
            Lupa Password
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Masukkan email akun Anda. Jika terdaftar, kami akan mengirimkan kode verifikasi.
          </Typography>
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleRequestReset();
              }
            }}
          />
          <TurnstileBox onToken={setTsToken} />
          <Button variant="contained" fullWidth onClick={handleRequestReset} disabled={isLoading} sx={{ height: 45 }}>
            {isLoading ? 'Memproses...' : 'Kirim Kode Verifikasi'}
          </Button>
        </>
      )}

      {step === 1 && (
        <>
          <Typography variant="h5" fontWeight="bold" textAlign="center">
            Verifikasi & Atur Ulang
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {requires2FA
              ? 'Masukkan kode dari Google Authenticator dan password baru Anda.'
              : 'Masukkan kode OTP yang dikirim ke email dan password baru Anda.'}
          </Typography>

          <TextField
            label={requires2FA ? 'Kode Google Authenticator' : 'Kode OTP Email'}
            fullWidth
            value={code}
            onChange={e => setCode(e.target.value)}
            inputProps={{ maxLength: 6 }}
          />

          <TextField
            label="Password Baru"
            type="password"
            fullWidth
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
          />
          <TextField
            label="Konfirmasi Password Baru"
            type="password"
            fullWidth
            value={confPass}
            onChange={e => setConfPass(e.target.value)}
          />

          <Button variant="contained" fullWidth onClick={handleVerifyAndReset} disabled={isLoading} sx={{ height: 45 }}>
            {isLoading ? 'Menyimpan...' : 'Reset Password'}
          </Button>
        </>
      )}

      <Button variant="text" onClick={onBack} sx={{ textTransform: 'none' }}>
        Kembali ke Login
      </Button>
    </Stack>
  );
};

const LoginPage = () => {
  const { connected } = useSocket();
  const [loginMethod, setLoginMethod] = useState();
  const [tsToken, setTsToken] = useState('');
  const [step, setStep] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [isTwoFA, setIsTwoFA] = useState(null);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [tempToken, setTempToken] = useState(null);
  const [pendingAuthToken, setPendingAuthToken] = useState(null);
  const [showSecurityPrompt, setShowSecurityPrompt] = useState(false);
  const [setupOriginStep, setSetupOriginStep] = useState(null);

  // State untuk mode Lupa Password
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [resetA2FCode, setResetA2FCode] = useState('');
  const [resetA2FMeta, setResetA2FMeta] = useState(null);
  const [resetA2FUsername, setResetA2FUsername] = useState('');
  const [resetA2FRequested, setResetA2FRequested] = useState(false);

  useEffect(() => {
    startTransition(() => {
      if (typeof window !== 'undefined') {
        const reason = sessionStorage.getItem('logout_reason');
        if (reason) {
          toast.warn(reason, { autoClose: 6000 });
          sessionStorage.removeItem('logout_reason');
        }
      }

      const token = Cookies.get('__access__token__');
      if (token) {
        reqCheckSession('owner')
          .then(result => {
            if (result.code === 200 && !result.error) {
              window.location.href = '/owner';
            }
          })
          .catch(() => { });
      }
    });
  }, []);

  const showAlert = msg => toast.error(msg);
  const resetAllLoginState = () => {
    setLoginMethod(undefined);
    setTsToken('');
    setStep(-1);
    setIsLoading(false);
    setUsername('');
    setPassword('');
    setCode('');
    setIsTwoFA(null);
    setTwoFASecret('');
    setQrImage('');
    setTempToken(null);
    setPendingAuthToken(null);
    setShowSecurityPrompt(false);
    setSetupOriginStep(null);
    setShowForgotPassword(false);

    // reset a2f state
    setResetA2FCode('');
    setResetA2FMeta(null);
    setResetA2FUsername('');
    setResetA2FRequested(false);
  };

  const handleLogin = async () => {
    if (!username || !password) return showAlert('Lengkapi data');
    setIsLoading(true);
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const payload = {
      ...(loginMethod == 'email' ? { email: username } : { username }),
      loginMethod,
      password,
      token: tsToken || (isLocalhost ? '' : ''),
    };
    const res = await reqApiHttp('/owner/auth/login', payload);
    setIsLoading(false);

    if (res.error) return showAlert(res.message);

    const data = res.data;
    if (data?.username) setResetA2FUsername(data.username);
    if (data?.setup2FA) {
      setTempToken(data.tempToken);
      setTwoFASecret(data.secretCode);
      setQrImage(data.qrImage);
      setIsTwoFA(false);
      setStep(2);
      toast.info('Silakan scan QR dan masukkan kode OTP untuk mengaktifkan 2FA');
      return;
    }

    if (data?.tempToken && (data?.authenticatorRequired === true || data?.isTwoFA === true)) {
      setTempToken(data.tempToken);
      setIsTwoFA(true);
      setStep(2);
      toast.info('Masukkan kode OTP dari Google Authenticator');
      return;
    }

    if (data?.authToken) {
      if (data?.suggestAuthenticator) {
        setPendingAuthToken(data.authToken);
        setShowSecurityPrompt(true);
        setStep(3);
        return;
      }

      toast.success('Login berhasil!');
      Cookies.set('__access__token__', data.authToken, { expires: 30 });
      window.location.href = '/owner';
      return;
    }

    showAlert('Respon login tidak dikenali');
  };

  const handleLoginWithOTP = async otp => {
    if (!tempToken) return showAlert('Sesi verifikasi tidak valid. Silakan login ulang.');
    setIsLoading(true);
    const res = await reqApiHttp('/owner/auth/login', {
      tempToken,
      otpVerification: otp,
    });
    setIsLoading(false);

    if (res.error) return showAlert(res.message);

    toast.success('Login berhasil!');
    setPendingAuthToken(null);
    setShowSecurityPrompt(false);
    setSetupOriginStep(null);
    Cookies.set('__access__token__', res.data.authToken, { expires: 30 });
    window.location.href = '/owner';
  };

  const finalizeLogin = token => {
    if (!token) return showAlert('Token login tidak tersedia');
    Cookies.set('__access__token__', token, { expires: 30 });
    window.location.href = '/owner';
  };

  const handleSkipAuthenticatorPrompt = () => {
    setShowSecurityPrompt(false);
    finalizeLogin(pendingAuthToken);
  };

  const handleEnableAuthenticatorFromPrompt = async () => {
    setSetupOriginStep(3);
    toast.info('Menyiapkan Authenticator...');
    await requestAuthenticatorSetupFromServer();
  };
  const handleVerifyEnableAuthenticator = async otp => {
    if (!tempToken) return showAlert('Sesi aktivasi tidak tersedia. Ulangi proses aktivasi.');
    setIsLoading(true);
    const res = await reqApiHttp('/owner/auth/login', { ...(loginMethod == 'email' ? { email: username } : { username }), loginMethod, password, tempToken, otpVerification: otp });
    setIsLoading(false);
    if (res.error) return showAlert(res.message);

    toast.success('Authenticator berhasil diaktifkan');
    setShowSecurityPrompt(false);
    setSetupOriginStep(null);
    finalizeLogin(pendingAuthToken);
  };

  const requestAuthenticatorSetupFromServer = async () => {
    if (!username || !password) {
      showAlert('Data login tidak lengkap');
      return false;
    }

    setIsLoading(true);
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const payload = {
      ...(loginMethod == 'email' ? { email: username } : { username }),
      loginMethod,
      password,
      requestAuthenticatorSetup: true,
      token: tsToken || (isLocalhost ? '' : ''),
    };
    const res = await reqApiHttp('/owner/auth/login', payload);
    setIsLoading(false);

    if (res.error) {
      showAlert(res.message);
      return false;
    }

    const data = res.data;
    if (!data?.setup2FA || !data?.tempToken) {
      showAlert('Respon setup authenticator tidak dikenali');
      return false;
    }

    setTempToken(data.tempToken);
    setTwoFASecret(data.secretCode || '');
    setQrImage(data.qrImage || '');
    setIsTwoFA(false);
    setStep(2);
    return true;
  };

  const handleSkipForcedAuthenticator = async () => {
    if (!username || !password) return showAlert('Data login tidak lengkap');

    setIsLoading(true);
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const payload = {
      ...(loginMethod == 'email' ? { email: username } : { username }),
      loginMethod,
      password,
      skipAuthenticator: true,
      token: tsToken || (isLocalhost ? '' : ''),
    };
    const res = await reqApiHttp('/owner/auth/login', payload);
    setIsLoading(false);

    if (res.error) return showAlert(res.message);

    const data = res.data;

    if (data?.authToken) {
      toast.success('Login berhasil!');
      Cookies.set('__access__token__', data.authToken, { expires: 30 });
      window.location.href = '/owner';
      return;
    }

    showAlert('Respon login tidak dikenali');
  };
  const openResetA2F = async () => {
    const u = resetA2FUsername || username;
    if (!u) return showAlert('Username tidak tersedia untuk reset A2F');

    setResetA2FCode('');
    setResetA2FMeta(null);
    setResetA2FRequested(false);
    setStep(4);

    await requestResetA2FOTP();
  };

  const requestResetA2FOTP = async () => {
    const u = resetA2FUsername || username;
    if (!u) return showAlert('Username tidak tersedia');
    setIsLoading(true);
    const res = await reqApiHttp('/owner/auth/2fa/reset', { username: u });
    setIsLoading(false);
    if (res.error) return showAlert(res.message);

    setResetA2FRequested(true);
    setResetA2FMeta(res.data || null);
    toast.info('Kode OTP reset A2F sudah dikirim ke email terdaftar.');
  };

  const verifyResetA2FOTP = async () => {
    const u = resetA2FUsername || username;
    if (!u) return showAlert('Username tidak tersedia');
    if (!resetA2FCode || String(resetA2FCode).trim().length !== 6) return showAlert('Kode OTP harus 6 digit');

    setIsLoading(true);
    const res = await reqApiHttp('/owner/auth/2fa/reset', { username: u, otpCode: String(resetA2FCode).trim() });
    setIsLoading(false);
    if (res.error) return showAlert(res.message);

    toast.success('2FA berhasil direset. Silakan login kembali.');
    resetAllLoginState();
  };

  // Logic untuk tombol Back
  const handleBackButton = () => {
    // Jika sedang di mode forgot password
    if (showForgotPassword) {
      setShowForgotPassword(false);
      return;
    }

    // Jika sedang setup authenticator dari security prompt
    if (step === 2 && setupOriginStep === 3 && isTwoFA === false) {
      setStep(3);
      setSetupOriginStep(null);
      return;
    }
    // Jika di step reset A2F
    if (step === 4) {
      setStep(2);
      return;
    }
    // Logic default
    if (step > -1) setStep(step - 1);
  };

  return (
    <Box display="flex" height="100vh" bgcolor="background.default" color="text.primary">
      <Box flex={1} display="flex" justifyContent="center" alignItems="center" px={2}>
        <AnimatePresence mode="wait">
          <motion.div
            // Key diubah agar animasi berjalan saat toggle forgot password
            key={showForgotPassword ? 'forgot-view' : step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', maxWidth: 400 }}
          >
            {/* Tombol Back Universal */}
            {(step > -1 || showForgotPassword) && (
              <IconButton sx={{ mb: 3 }} variant="outlined" size="large" onClick={handleBackButton}>
                <ArrowBack />
              </IconButton>
            )}

            {showForgotPassword ? (
              // RENDER FORGOT PASSWORD
              <ForgotPasswordFlow onBack={() => setShowForgotPassword(false)} onSwitchToLogin={() => setShowForgotPassword(false)} />
            ) : (
              // RENDER LOGIN STEPS
              <>
                {step === -1 && (
                  <Stack spacing={2}>
                    <Typography variant="h5" fontWeight="bold" textAlign="center">
                      Pilih Metode Login
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => {
                        setUsername('');
                        setPassword('');
                        setLoginMethod('username');
                        setStep(0);
                      }}
                      sx={{ height: 45 }}
                    >
                      Login username
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => {
                        setUsername('');
                        setPassword('');
                        setLoginMethod('email');
                        setStep(0);
                      }}
                      sx={{ height: 45 }}
                    >
                      Login email
                    </Button>
                  </Stack>
                )}

                <Stack spacing={2}>
                  <Typography variant="h5" fontWeight="bold" textAlign="center">
                    {step === 0 && 'Masukkan ' + loginMethod}
                    {step === 1 && 'Masukkan password'}
                    {step === 2 && (isTwoFA === false ? 'Aktivasi Authenticator' : 'Kode OTP')}
                    {step === 3 && 'Keamanan Akun'}
                    {step === 4 && 'Reset A2F'}
                  </Typography>

                  {step === 0 && (
                    <TextField
                      label={loginMethod}
                      fullWidth
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          setStep(1);
                        }
                      }}
                    />
                  )}

                  {step === 1 && (
                    <>
                      <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleLogin();
                          }
                        }}
                      />
                      <TurnstileBox onToken={setTsToken} />

                      {/* LINK FORGOT PASSWORD */}
                      <Box display="flex" justifyContent="flex-end" mt={-1}>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => setShowForgotPassword(true)}
                          sx={{ textTransform: 'none', px: 0, minWidth: 0, color: 'primary.main' }}
                        >
                          Lupa Password?
                        </Button>
                      </Box>
                    </>
                  )}

                  {step === 2 && isTwoFA === true && (
                    <>
                      <TextField
                        autoFocus
                        label="Kode Authenticator"
                        fullWidth
                        value={code}
                        onChange={e => {
                          const val = e.target.value;
                          setCode(val);
                          if (val.length === 6) handleLoginWithOTP(val);
                        }}
                        inputProps={{ maxLength: 6 }}
                      />
                      <Box display="flex" justifyContent="flex-end" mt={-1}>
                        <Button variant="text" size="small" onClick={openResetA2F} sx={{ textTransform: 'none', px: 0, minWidth: 0 }}>
                          Reset A2F
                        </Button>
                      </Box>
                    </>
                  )}

                  {step === 2 && isTwoFA === false && (
                    <Stack spacing={2}>
                      <SettingAuth
                        mode={setupOriginStep === 3 ? 'setup' : 'force'}
                        secretCode={twoFASecret}
                        qrImage={qrImage}
                        onRequestSetup={requestAuthenticatorSetupFromServer}
                        onSuccess={otp => {
                          if (setupOriginStep === 3) return handleVerifyEnableAuthenticator(otp);
                          return handleLoginWithOTP(otp);
                        }}
                      />
                      {setupOriginStep !== 3 && (
                        <Button variant="outlined" fullWidth disabled={isLoading} onClick={handleSkipForcedAuthenticator} sx={{ height: 45 }}>
                          Lewati & Matikan 2FA
                        </Button>
                      )}
                    </Stack>
                  )}

                  {step === 3 && (
                    <Stack spacing={2}>
                      <Typography textAlign="center" color="text.secondary">
                        Untuk meningkatkan keamanan akun, aktifkan Authenticator (2FA). Kamu bisa melewati langkah ini dan mengaktifkannya nanti di menu pengaturan.
                      </Typography>
                      <TurnstileBox onToken={setTsToken} />
                      <Button variant="contained" fullWidth onClick={handleEnableAuthenticatorFromPrompt} sx={{ height: 45 }}>
                        Aktifkan sekarang
                      </Button>

                      <Button variant="outlined" fullWidth onClick={handleSkipAuthenticatorPrompt} sx={{ height: 45 }}>
                        Lewati untuk sekarang
                      </Button>
                    </Stack>
                  )}
                  {step === 4 && (
                    <Stack spacing={2}>
                      <Typography textAlign="center" color="text.secondary">
                        Kami akan mengirim kode OTP ke email yang terdaftar pada akun ini untuk mereset Authenticator (2FA).
                      </Typography>

                      {!!resetA2FMeta?.email && (
                        <Typography textAlign="center" fontSize={13} color="text.secondary">
                          Dikirim ke: <b>{resetA2FMeta.email}</b>
                        </Typography>
                      )}

                      <TextField autoFocus label="Kode OTP Reset A2F" fullWidth value={resetA2FCode} onChange={e => setResetA2FCode(e.target.value)} inputProps={{ maxLength: 6 }} />

                      <Button variant="contained" fullWidth disabled={isLoading} onClick={verifyResetA2FOTP} sx={{ height: 45 }}>
                        {isLoading ? 'Loading...' : 'Verifikasi & Reset'}
                      </Button>

                      <Button variant="outlined" fullWidth disabled={isLoading} onClick={requestResetA2FOTP} sx={{ height: 45 }}>
                        Kirim ulang OTP
                      </Button>

                      <Button variant="text" fullWidth onClick={() => setStep(2)} sx={{ height: 45, textTransform: 'none' }}>
                        Kembali ke input OTP
                      </Button>
                    </Stack>
                  )}

                  {step < 2 && step > -1 && (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => {
                        if (step === 0) return setStep(1);
                        if (step === 1) return handleLogin();
                      }}
                      disabled={isLoading}
                      sx={{ height: 45 }}
                    >
                      {isLoading ? 'Loading...' : 'Lanjut'}
                    </Button>
                  )}
                </Stack>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </Box>

      <Box
        flex={1}
        sx={{
          backgroundImage: 'url(/login-illustration-image.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: { xs: 'none', md: 'block' },
        }}
      />
    </Box>
  );
};

export default LoginPage;