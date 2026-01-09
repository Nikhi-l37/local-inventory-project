import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo.jsx';
import styles from './AuthPage.module.css';

function AuthPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const isRegisterRoute = location.pathname === '/register';
    const [isLogin, setIsLogin] = useState(!isRegisterRoute);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [loading, setLoading] = useState(false);

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setFormData({ email: '', password: '' });
        navigate(isLogin ? '/register' : '/login', { replace: true });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const response = await api.post('/api/sellers/login', {
                    email: formData.email,
                    password: formData.password
                });
                localStorage.setItem('token', response.data.token);
                navigate('/dashboard');
            } else {
                const response = await api.post('/api/sellers/register', {
                    email: formData.email,
                    password: formData.password
                });
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    navigate('/dashboard');
                } else {
                    alert('Account created! Please log in.');
                    toggleMode();
                }
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || err.response?.data || 'An error occurred';
            alert(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>

            {/* 1. Logo Section */}
            <div className={styles.logoContainer}>
                {/* We use specific sizing for the logo to match the GitHub icon feel */}
                <Logo />
            </div>

            {/* 2. Page Title */}
            <h1 className={styles.pageTitle}>
                {isLogin ? 'Sign in to Finder' : 'Create your account'}
            </h1>

            {/* 3. The Main Card */}
            <div className={styles.authCard}>
                <form className={styles.form} onSubmit={handleSubmit}>

                    {/* Email Field */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Username or email address</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            className={styles.inputField}
                            value={formData.email}
                            onChange={handleChange}
                            required
                            autoFocus
                        />
                    </div>

                    {/* Password Field */}
                    <div className={styles.inputGroup}>
                        <div className={styles.passwordHeader}>
                            <label htmlFor="password">Password</label>
                            {isLogin && (
                                <Link to="/forgot-password" className={styles.forgotLink}>
                                    Forgot password?
                                </Link>
                            )}
                        </div>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            className={styles.inputField}
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create account')}
                    </button>
                </form>

                {/* Social Options (Visual Only) */}
                <div className={styles.socialSection}>
                    <div className={styles.divider}>or</div>

                    <button type="button" className={styles.socialBtn}>
                        {/* Google Icon SVG */}
                        <svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: '8px' }}>
                            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.249 C -21.864 50.459 -21.734 49.689 -21.484 48.969 L -21.484 45.879 L -25.464 45.879 C -26.284 47.509 -26.754 49.329 -26.754 51.249 C -26.754 53.169 -26.284 54.989 -25.464 56.619 L -21.484 53.529 Z" />
                                <path fill="#EA4335" d="M -14.754 44.009 C -12.984 44.009 -11.424 44.619 -10.174 45.809 L -6.714 42.349 C -8.804 40.409 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.879 L -21.484 48.969 C -20.534 46.119 -17.884 44.009 -14.754 44.009 Z" />
                            </g>
                        </svg>
                        Continue with Google
                    </button>

                    <button type="button" className={styles.socialBtn}>
                        {/* Apple Icon */}
                        <svg viewBox="0 0 384 512" width="18" height="18" fill="white" style={{ marginRight: '8px' }}>
                            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 69 126.7 112.5 132.3 20.2 2.6 38.5-18.5 58.6-18.5 20.1 0 46.4 22.3 84.7 18 35.7-4.3 90.2-115.6 90.2-115.6-1.5-1-66.9-24.4-65.7-102.3zM232.9 83c27.1-33.1 24.1-81.2 23.9-83-26.6 2.1-59.5 17.5-79 40.7-18.8 22.1-36.1 76-32.9 82.2 31.9.1 57.7-16.7 88-39.9z" />
                        </svg>
                        Continue with Apple
                    </button>
                </div>
            </div>

            {/* 4. Switcher Box */}
            <div className={styles.switchBox}>
                <span className={styles.switchText}>
                    {isLogin ? 'New to Finder? ' : 'Already have an account? '}
                </span>
                <button className={styles.switchLink} onClick={toggleMode}>
                    {isLogin ? 'Create an account' : 'Sign in'}
                </button>
            </div>

            <div className={styles.footerLinks}>
                <span>Terms</span>
                <span>Privacy</span>
                <span>Security</span>
                <span>Contact Finder</span>
            </div>

        </div>
    );
}

export default AuthPage;
