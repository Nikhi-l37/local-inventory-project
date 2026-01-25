import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import styles from './Auth.module.css'; // New CSS file

function Auth() {
    const navigate = useNavigate();
    const location = useLocation();
    // Determine initial mode based on URL or default to login
    const [isLogin, setIsLogin] = useState(!location.pathname.includes('register'));

    // Step 1: Email & Password
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Step 2: OTP Verification
    const [otp, setOtp] = useState('');
    const [challengeId, setChallengeId] = useState(null);
    const [otpExpiry, setOtpExpiry] = useState(null);
    const [remainingTime, setRemainingTime] = useState(300);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [attemptsRemaining, setAttemptsRemaining] = useState(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Countdown timer for OTP expiry
    useEffect(() => {
        if (!otpExpiry) return;

        const interval = setInterval(() => {
            const now = new Date();
            const remaining = Math.floor((otpExpiry - now) / 1000);
            
            if (remaining <= 0) {
                setRemainingTime(0);
                clearInterval(interval);
            } else {
                setRemainingTime(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [otpExpiry]);

    // Countdown timer for resend cooldown
    useEffect(() => {
        if (resendCooldown <= 0) return;

        const interval = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [resendCooldown]);

    // Toggle mode
    const toggleMode = () => {
        setIsLogin(!isLogin);
        resetForm();
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setOtp('');
        setChallengeId(null);
        setOtpExpiry(null);
        setRemainingTime(300);
        setError('');
        setAttemptsRemaining(null);
        setResendCooldown(0);
    };

    // ============================================
    // STEP 1: Email & Password Submission
    // ============================================
    const handleEmailPasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = { email: email.trim(), password: password.trim() };

        try {
            if (isLogin) {
                // LOGIN: POST /api/sellers/login
                const response = await api.post('/api/sellers/login', payload);
                
                if (response.data.otpRequired) {
                    // OTP required - move to Step 2
                    setChallengeId(response.data.challengeId);
                    const expiryTime = new Date();
                    expiryTime.setSeconds(expiryTime.getSeconds() + response.data.expiresIn);
                    setOtpExpiry(expiryTime);
                    setRemainingTime(response.data.expiresIn);
                    setOtp(''); // Clear OTP input
                    
                    if (response.data.warning) {
                        setError(`⚠️ ${response.data.warning}`);
                    }
                }
            } else {
                // REGISTER: POST /api/sellers/register
                await api.post('/api/sellers/register', payload);
                
                // Auto login after register to trigger OTP
                const loginResponse = await api.post('/api/sellers/login', payload);
                
                if (loginResponse.data.otpRequired) {
                    setChallengeId(loginResponse.data.challengeId);
                    const expiryTime = new Date();
                    expiryTime.setSeconds(expiryTime.getSeconds() + loginResponse.data.expiresIn);
                    setOtpExpiry(expiryTime);
                    setRemainingTime(loginResponse.data.expiresIn);
                    setOtp('');
                }
            }
        } catch (err) {
            console.error('Auth failed:', err.response?.data);
            setError((isLogin ? 'Login' : 'Registration') + ' Failed: ' + (err.response?.data?.error || err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // STEP 2: OTP Verification
    // ============================================
    const handleOTPSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/api/sellers/verify-otp', {
                challengeId,
                otp: otp.trim(),
            });

            // Success! Store token and navigate
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message;
            setError(errorMsg);
            
            if (err.response?.data?.attemptsRemaining !== undefined) {
                setAttemptsRemaining(err.response.data.attemptsRemaining);
            }
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // RESEND OTP
    // ============================================
    const handleResendOTP = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/api/sellers/resend-otp', {
                challengeId,
            });

            // Update expiry
            const expiryTime = new Date();
            expiryTime.setSeconds(expiryTime.getSeconds() + response.data.expiresIn);
            setOtpExpiry(expiryTime);
            setRemainingTime(response.data.expiresIn);
            setOtp('');
            setAttemptsRemaining(null);
            
            // Start cooldown
            setResendCooldown(30);
            setError('✓ New OTP sent to your email');
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message;
            setError(errorMsg);
            
            if (err.response?.data?.cooldownSeconds > 0) {
                setResendCooldown(err.response.data.cooldownSeconds);
            }
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // UI: Show OTP Verification Step
    // ============================================
    if (challengeId) {
        return (
            <div className={styles.authContainer}>
                <div className={styles.logoSection}>
                    <Logo simple={true} />
                </div>

                <h2 className={styles.authTitle}>
                    Verify Your OTP
                </h2>

                <div className={styles.authCard}>
                    <p className={styles.otpInfo}>
                        Enter the 6-digit code sent to <strong>{email}</strong>
                    </p>

                    <form onSubmit={handleOTPSubmit}>
                        <div className={styles.formGroup}>
                            <label>One-Time Password</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                maxLength="6"
                                required
                                autoFocus
                                className={styles.otpInput}
                            />
                        </div>

                        <button type="submit" className={styles.submitButton} disabled={loading || otp.length !== 6}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </form>

                    <div className={styles.otpMeta}>
                        <p className={remainingTime < 60 ? styles.expiringSoon : ''}>
                            ⏱️ Expires in {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
                        </p>
                        {attemptsRemaining !== null && (
                            <p className={attemptsRemaining < 2 ? styles.warningText : ''}>
                                {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                            </p>
                        )}
                    </div>

                    <div className={styles.resendSection}>
                        <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={resendCooldown > 0 || loading}
                            className={styles.resendButton}
                        >
                            {resendCooldown > 0
                                ? `Resend in ${resendCooldown}s`
                                : 'Resend OTP'}
                        </button>
                    </div>

                    {error && (
                        <p className={error.includes('✓') ? styles.successMessage : styles.errorMessage}>
                            {error}
                        </p>
                    )}
                </div>

                <div className={styles.authFooter}>
                    <button onClick={resetForm} className={styles.linkButton}>
                        ← Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // ============================================
    // UI: Show Email & Password Step
    // ============================================
    return (
        <div className={styles.authContainer}>
            <div className={styles.logoSection}>
                <Logo simple={true} /> {/* Use Finder Logo */}
            </div>

            <h2 className={styles.authTitle}>
                {isLogin ? 'Sign in to Finder' : 'Create your account'}
            </h2>

            <div className={styles.authCard}>
                <form onSubmit={handleEmailPasswordSubmit}>
                    <div className={styles.formGroup}>
                        <label>Email address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <div className={styles.labelRow}>
                            <label>Password</label>
                            {isLogin && <a href="/forgot-password" className={styles.forgotLink}>Forgot password?</a>}
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <p className={styles.errorMessage}>
                            {error}
                        </p>
                    )}

                    <button type="submit" className={styles.submitButton} disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
                    </button>
                </form>
            </div>

            <div className={styles.authFooter}>
                <p>
                    {isLogin ? 'New to Finder? ' : 'Already have an account? '}
                    <button onClick={toggleMode} className={styles.linkButton}>
                        {isLogin ? 'Create an account' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Auth;
