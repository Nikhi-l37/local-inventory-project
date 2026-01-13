import React, { useState } from 'react';
import api from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import styles from './Auth.module.css'; // New CSS file

function Auth() {
    const navigate = useNavigate();
    const location = useLocation();
    // Determine initial mode based on URL or default to login
    const [isLogin, setIsLogin] = useState(!location.pathname.includes('register'));

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Toggle mode
    const toggleMode = () => {
        setIsLogin(!isLogin);
        setEmail('');
        setPassword('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const payload = { email: email.trim(), password: password.trim() };

        try {
            if (isLogin) {
                // LOGIN
                const response = await api.post('/api/sellers/login', payload);
                localStorage.setItem('token', response.data.token);
                navigate('/dashboard');
            } else {
                // REGISTER
                const response = await api.post('/api/sellers/register', payload);
                alert('Registration successful! Logging you in...');
                // Auto login after register
                const loginRes = await api.post('/api/sellers/login', payload);
                localStorage.setItem('token', loginRes.data.token);
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Auth failed:', err.response?.data);
            alert((isLogin ? 'Login' : 'Registration') + ' Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.logoSection}>
                <Logo simple={true} /> {/* Use Finder Logo */}
            </div>

            <h2 className={styles.authTitle}>
                {isLogin ? 'Sign in to Finder' : 'Create your account'}
            </h2>

            <div className={styles.authCard}>
                <form onSubmit={handleSubmit}>
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
