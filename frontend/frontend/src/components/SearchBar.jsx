import React from 'react';

const SearchBar = ({ search, category, onSearchChange, onCategoryChange }) => {
  const categories = ["All Categories", "Electronics", "Fashion", "Books", "Home"];

  return (
    <div className="search-filter-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="category-select-wrapper">
        <select
          className="category-select"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SearchBar;
