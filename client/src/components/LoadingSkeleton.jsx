import React from 'react';
import styles from './LoadingSkeleton.module.css';

// Generic skeleton loader component
export const SkeletonBox = ({ width = '100%', height = '20px', borderRadius = '4px', className = '' }) => (
  <div 
    className={`${styles.skeleton} ${className}`}
    style={{ width, height, borderRadius }}
  />
);

// Product card skeleton
export const ProductCardSkeleton = () => (
  <div className={styles.productCardSkeleton}>
    <SkeletonBox height="160px" borderRadius="12px 12px 0 0" />
    <div className={styles.productCardContent}>
      <SkeletonBox width="70%" height="20px" />
      <SkeletonBox width="50%" height="16px" />
      <SkeletonBox width="40%" height="24px" />
    </div>
  </div>
);

// Result card skeleton for search
export const ResultCardSkeleton = () => (
  <div className={styles.resultCardSkeleton}>
    <div className={styles.cardHeader}>
      <SkeletonBox width="56px" height="56px" borderRadius="10px" />
      <div style={{ flex: 1 }}>
        <SkeletonBox width="70%" height="18px" />
        <SkeletonBox width="50%" height="14px" />
      </div>
    </div>
  </div>
);

// Generic page loader
export const PageLoader = () => (
  <div className={styles.pageLoader}>
    <div className={styles.spinner}></div>
    <p>Loading...</p>
  </div>
);

export default { SkeletonBox, ProductCardSkeleton, ResultCardSkeleton, PageLoader };
