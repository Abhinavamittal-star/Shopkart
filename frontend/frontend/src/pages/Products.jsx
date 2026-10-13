import React, { useState, useEffect } from 'react';
import API from '../services/api';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';

const Products = ({ user, userWishlist = [], onWishlistToggle }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async (searchTerm, categoryTerm) => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm.trim();
      }
      if (categoryTerm && categoryTerm !== 'All Categories') {
        params.category = categoryTerm;
      }

      const response = await API.get('/products', { params });

      if (response.data && response.data.products) {
        setProducts(response.data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(search, category);
  }, [search, category]);

  const wishlistSet = new Set(
    (userWishlist || []).map((item) => (typeof item === 'object' ? item._id : item))
  );

  return (
    <div className="products-page-container">
      <div className="products-header">
        <h1>Product Discovery</h1>
        <p>Explore our catalog of quality products</p>
      </div>

      <SearchBar
        search={search}
        category={category}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
      />

      {loading ? (
        <div className="state-container loading-state">
          <p>Loading products...</p>
        </div>
      ) : error ? (
        <div className="state-container error-state">
          <p>{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="state-container empty-state">
          <p>No products found.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              isWishlisted={wishlistSet.has(product._id)}
              userLoggedIn={!!user}
              onWishlistToggle={onWishlistToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
