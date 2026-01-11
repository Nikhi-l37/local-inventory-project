import React, { useState, useEffect } from 'react';
import api from '../api';
import styles from '../pages/Dashboard.module.css'; // Using Dashboard styles for consistency

function CategoryManager({ shop, onCategoriesChange }) {
    const [categories, setCategories] = useState([]);
    const [newCatName, setNewCatName] = useState('');
    const [loading, setLoading] = useState(false);

    const loadCategories = async () => {
        try {
            const res = await api.get(`/api/categories/shop/${shop.id}`);
            setCategories(res.data);
            if (onCategoriesChange) onCategoriesChange();
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shop.id]);

    const handleAddCategory = async () => {
        if (!newCatName) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', newCatName);
            // No image for category as per request

            await api.post('/api/categories', formData);
            setNewCatName('');
            loadCategories();
        } catch (err) {
            console.error(err);
            alert('Error adding category');
        } finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category? Products will be uncategorized.')) return;
        try {
            await api.delete(`/api/categories/${id}`);
            loadCategories();
        } catch (err) { console.error(err); }
    };

    return (
        <div className={styles.managerContainer}>
            <h2>Category Manager</h2>
            <p className={styles.subtext}>Create and manage categories for your products.</p>

            <div className={styles.categoryGrid}>
                {categories.map(cat => (
                    <div key={cat.id} className={styles.categoryCard}>
                        <div className={styles.catCardInfo}>
                            <h4>{cat.name}</h4>
                            <button onClick={() => handleDelete(cat.id)} className={styles.deleteBtn}>Delete</button>
                        </div>
                    </div>
                ))}

                {/* ADD NEW CARD */}
                <div className={styles.addCategoryCard}>
                    <h4>Add New</h4>
                    <input
                        type="text"
                        placeholder="Category Name"
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        className={styles.inputField}
                    />
                    {/* Image input removed */}
                    <button onClick={handleAddCategory} disabled={loading} className={styles.actionBtn}>
                        {loading ? 'Adding...' : '+ Create Category'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CategoryManager;
