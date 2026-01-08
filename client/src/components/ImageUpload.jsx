import React, { useState, useEffect } from 'react';
import styles from './ImageUpload.module.css';

const ImageUpload = ({ label, currentImage, onImageSelect }) => {
    const [preview, setPreview] = useState(currentImage);

    // If the parent updates the currentImage (e.g. after fetch), update preview
    useEffect(() => {
        if (currentImage) {
            setPreview(currentImage.startsWith('http') ? currentImage : `${import.meta.env.VITE_API_BASE_URL}${currentImage}`);
        }
    }, [currentImage]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Create a local URL for preview immediately
            setPreview(URL.createObjectURL(file));
            // Pass the actual file back to the parent form
            onImageSelect(file);
        }
    };

    return (
        <div className={styles.uploadContainer}>
            <label className={styles.label}>{label}</label>
            <div className={styles.previewArea}>
                {preview ? (
                    <img src={preview} alt="Preview" className={styles.previewImage} />
                ) : (
                    <div className={styles.placeholder}>
                        <span>No Image Selected</span>
                    </div>
                )}
            </div>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.fileInput}
            />
        </div>
    );
};

export default ImageUpload;
