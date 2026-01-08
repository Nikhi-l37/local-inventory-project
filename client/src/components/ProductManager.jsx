import React, { useState, useEffect } from 'react';
import api from '../api';
import ImageUpload from './ImageUpload.jsx';
import styles from './ProductManager.module.css';

function ProductManager({ shop, categories, selectedCategory, onStatsUpdate }) {
  const [products, setProducts] = useState([]);

  // Local Form State
  const [isEditing, setIsEditing] = useState(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null); // Track which menu is open

  // Modal State
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setProducts([]); // Clear strictly to avoid mixing
    fetchProducts();
  }, [shop.id]);

  // Handle Filtering match
  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category_id == selectedCategory || (selectedCategory === 'General' && !p.category_id));

  // Update Stats Effect
  useEffect(() => {
    if (onStatsUpdate) {
      const total = products.length;
      const active = products.filter(p => p.is_available).length;
      onStatsUpdate({
        total,
        active,
        inactive: total - active
      });
    }
  }, [products]);


  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/shops/my-shop/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategoryId('');
    setPrice('');
    setDescription('');
    setImage(null);
    setIsEditing(null);
    setShowModal(false);
  };

  const handleEditClick = (product) => {
    setIsEditing(product.id);
    setName(product.name);
    setCategoryId(product.category_id || '');
    setPrice(product.price || '');
    setDescription(product.description || '');
    setImage(null);
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      const formData = new FormData();
      formData.append('name', name);

      // Handle Category
      if (categoryId) {
        formData.append('category_id', categoryId);
        const cat = categories.find(c => c.id == categoryId);
        if (cat) formData.append('category', cat.name);
      } else {
        formData.append('category', 'General');
      }

      formData.append('price', price);
      formData.append('description', description);
      if (image) formData.append('image', image);

      let response;
      if (isEditing) {
        const currentProduct = products.find(p => p.id === isEditing);
        formData.append('is_available', currentProduct.is_available);
        response = await api.patch(`/api/products/${isEditing}/details`, formData);
        setProducts(products.map(p => p.id === isEditing ? response.data : p));
      } else {
        response = await api.post('/api/products', formData);
        setProducts([...products, response.data]);
      }
      resetForm();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Failed to save product.');
    }
  };

  // ... (Toggle and Delete handlers remain similar)
  const handleToggleProduct = async (productId, currentStatus) => {
    try {
      const response = await api.patch(`/api/products/${productId}`, { is_available: !currentStatus });
      setProducts(products.map(p => p.id === productId ? response.data : p));
    } catch (err) { console.error(err); }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Delete product?')) {
      try {
        await api.delete(`/api/products/${productId}`);
        setProducts(products.filter(p => p.id !== productId));
      } catch (err) { console.error(err); }
    }
  };


  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.managerContainer}>
      {/* HEADER */}
      <div className={styles.managerHeader}>
        <div>
          <h2>{selectedCategory === 'All' ? 'All Products' : categories.find(c => c.id == selectedCategory)?.name || 'Products'}</h2>
          <p>{filteredProducts.length} items found</p>
        </div>
        <button onClick={() => setShowModal(true)} className={styles.addBtn}>
          + Add Product
        </button>
      </div>

      {/* PRODUCT GRID */}
      <div className={styles.productGrid}>
        {filteredProducts.map(product => (
          <div key={product.id} className={styles.productCard}>
            {/* Image Area */}
            <div className={styles.cardImageContainer}>
              {product.image_url ? (
                <img src={`${import.meta.env.VITE_API_BASE_URL}${product.image_url}`} alt={product.name} />
              ) : <div className={styles.cardNoImage}>No Image</div>}

              <span className={`${styles.statusBadge} ${product.is_available ? styles.inStock : styles.outOfStock}`}>
                {product.is_available ? 'In Stock' : 'Out of Stock'}
              </span>

              {/* Top Right Pencil Menu */}
              <div className={styles.menuContainer}>
                <button
                  className={styles.menuTrigger}
                  onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === product.id ? null : product.id); }}
                >
                  ✏️
                </button>

                {openMenuId === product.id && (
                  <div className={styles.dropdownMenu}>
                    <button onClick={() => { setOpenMenuId(null); handleEditClick(product); }}>
                      Option: Rename/Edit
                    </button>
                    <button onClick={() => { setOpenMenuId(null); handleToggleProduct(product.id, product.is_available); }}>
                      Option: {product.is_available ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    {/* "Change Image" is part of Edit, but user asked for it specifically. It basically leads to same edit form */}
                    <button onClick={() => { setOpenMenuId(null); handleEditClick(product); }}>
                      Option: Change Image
                    </button>
                    <button onClick={() => { setOpenMenuId(null); handleDeleteProduct(product.id); }} className={styles.dangerItem}>
                      Option: Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className={styles.cardContent}>
              <div className={styles.cardHeaderRow}>
                <span className={styles.catBadge}>{product.category}</span>
                <span className={styles.priceTag}>₹{product.price}</span>
              </div>
              <h3>{product.name}</h3>
              <p className={styles.desc}>{product.description}</p>
              {/* Bottom Actions Removed as requested */}
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className={styles.emptyState}>
            <p>No products found in this category.</p>
            <button onClick={() => setShowModal(true)}>Add your first product</button>
          </div>
        )}
      </div>


      {/* MODAL */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSaveProduct} className={styles.modalForm}>
              <div className={styles.imageUploadWrapper}>
                <ImageUpload label="Product Image" currentImage={null} onImageSelect={setImage} />
              </div>
              <div className={styles.fieldsWrapper}>
                <input type="text" placeholder="Product Name" value={name} onChange={e => setName(e.target.value)} required />
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  <option value="">-- Select Category --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="number" placeholder="Price (₹)" value={price} onChange={e => setPrice(e.target.value)} />
                <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows="3" />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={resetForm} className={styles.secondaryButton}>Cancel</button>
                <button type="submit" className={styles.primaryButton}>{isEditing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


export default ProductManager;