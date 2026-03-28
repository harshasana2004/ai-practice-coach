import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const CategoryListPage = () => {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'categories'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userCategories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(userCategories);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!user || !newCategoryName.trim()) return;

    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategoryName,
        userId: user.uid,
        createdAt: new Date(),
      });
      setNewCategoryName("");
    } catch (error) {
      console.error("Error creating category (Check your Firestore rules): ", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category? This will not delete its sessions, but they will be uncategorized.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
    } catch (error) {
      console.error("Error deleting category (Check your Firestore rules): ", error);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '64rem', margin: 'auto' }}>
      <div className="page-header" style={{textAlign: 'left'}}>
          <h1 className="title">Practice Categories</h1>
          <p className="subtitle">Organize your practice sessions into categories like "Interviews" or "Presentations".</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>Create a New Category</h2>
        <form onSubmit={handleCreateCategory} className="add-category-form">
          <input
            type="text"
            className="add-category-input"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g., Job Interviews"
          />
          <button type="submit" className="add-category-button">Create</button>
        </form>
      </div>

      {loading && <p>Loading categories...</p>}
      <div className="category-grid">
        {!loading && categories.length === 0 && (
          <p className="subtitle" style={{ textAlign: 'center' }}>You have no categories. Create one above to get started.</p>
        )}
        {categories.map(cat => (
          <Link to={`/category/${cat.id}`} key={cat.id} className="category-card">
            <h2 className="category-card-title">{cat.name}</h2>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleDeleteCategory(cat.id);
              }}
              className="category-card-delete-btn"
            >
              &#x2715;
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryListPage;