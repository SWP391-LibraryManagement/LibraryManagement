import { useEffect, useState } from 'react';
import { Button, Stack, TextField } from '@mui/material';
import { getCaptcha } from '../../api/authApi';
import { loadCaptchaWithRetry } from '../../utils/captchaRecovery';

export default function CaptchaField({ onChange, refreshKey = 0, disabled = false }) {
  // @spec FR-FE02-030
  const [challenge, setChallenge] = useState(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const loadCaptcha = async ({ retry = false, discardCurrent = false } = {}) => {
    const hasFallback = Boolean(challenge) && !discardCurrent;
    if (discardCurrent) {
      setChallenge(null);
      setAnswer('');
      onChange?.({ captchaToken: '', captchaAnswer: '' });
    }

    try {
      const next = await loadCaptchaWithRetry(getCaptcha, { attempts: retry ? 2 : 1 });
      setChallenge(next);
      setAnswer('');
      onChange?.({ captchaToken: '', captchaAnswer: '' });
      setError('');
    } catch {
      if (!hasFallback) {
        setChallenge(null);
        setAnswer('');
        onChange?.({ captchaToken: '', captchaAnswer: '' });
      }
      setError('Không tải được CAPTCHA. Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCaptcha({ retry: true, discardCurrent: refreshKey > 0 });
    }, 0);
    return () => window.clearTimeout(timer);
    // The challenge must be reloaded only when the parent rejects it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const updateAnswer = (value) => {
    const nextAnswer = value.replace(/[^a-z]/gi, '').slice(0, 6);
    setAnswer(nextAnswer);
    onChange?.({ captchaToken: challenge?.captchaToken || '', captchaAnswer: nextAnswer });
  };

  return (
    <Stack spacing={1}>
      {challenge && <img src={challenge.image} alt="CAPTCHA gồm 4 đến 6 chữ cái" width="180" height="54" />}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <TextField
          fullWidth
          label="Nhập mã CAPTCHA"
          value={answer}
          onChange={(event) => updateAnswer(event.target.value)}
          disabled={disabled || !challenge}
          error={Boolean(error)}
          helperText={error || 'Nhập đúng chữ cái hiển thị trong ảnh.'}
          slotProps={{ htmlInput: { autoComplete: 'off', maxLength: 6 } }}
        />
        <Button type="button" onClick={() => { void loadCaptcha(); }} disabled={disabled}>Đổi mã</Button>
      </Stack>
    </Stack>
  );
}
