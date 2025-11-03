import React, { useState, useEffect } from 'react';
import api from '../api';

// 1. This imports the styles
import styles from './ProductManager.module.css'; 

function ProductManager({ shop }) {
  const [products, setProducts] = useState([]);
  const [newProductName, setNewProductName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/api/shops/my-shop/products');
        setProducts(response.data);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [shop.id]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProductName) return;
    try {
      const response = await api.post('/api/products', {
        name: newProductName,
      });
      setProducts([...products, response.data]);
      setNewProductName('');
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Failed to add product.');
    }
  };

  const handleToggleProduct = async (productId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const response = await api.patch(`/api/products/${productId}`, {
        is_available: newStatus,
      });
      setProducts(
        products.map((p) => (p.id === productId ? response.data : p))
      );
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/api/products/${productId}`);
        setProducts(products.filter((p) => p.id !== productId));
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Failed to delete product.');
      }
    }
  };

  if (loading) return <div>Loading products...</div>;

  // 2. This JSX applies all the 'className' styles
  return (
    <div className={styles.productContainer}>
      <h3>Product Manager</h3>

      <form onSubmit={handleAddProduct} className={styles.addForm}>
        <input
          type="text"
          value={newProductName}
          onChange={(e) => setNewProductName(e.target.value)}
          placeholder="New product name"
          className={styles.productInput}
        />
        <button type="submit" className={styles.addButton}>Add Product</button>
      </form>

      <hr />

      {products.length === 0 ? (
        <p>You haven't added any products yet.</p>
      ) : (
        <ul className={styles.productList}>
          {products.map((product) => (
            <li key={product.id} className={styles.productItem}>
              <div>
                <span className={styles.productName}>{product.name}</span>
                <span 
                  className={`${styles.productStatus} ${
                    product.is_available ? styles.available : styles.unavailable
                  }`}
                >
                  (Status: {product.is_available ? 'Available' : 'Unavailable'})
                </span>
              </div>

              {/* --- HERE ARE YOUR STYLED BUTTONS --- */}
             {/* --- HERE ARE YOUR BUTTONS --- */}
              <div className={styles.buttonGroup}>
                <button 
                  onClick={() => handleToggleProduct(product.id, product.is_available)}
                  className={`${styles.toggleButton} ${
                    product.is_available ? styles.unavailable : styles.available
                  }`}
                >
                  {product.is_available ? 'Set Unavailable' : 'Set Available'}
                </button>
                <button 
                  onClick={() => handleDeleteProduct(product.id)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}






        </ul>
      )}
    </div>
  );
}

export default ProductManager;