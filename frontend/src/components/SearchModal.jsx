import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { advancedSearch, getSearchSuggestions } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState({ users: [], posts: [], messages: [] });
  const [suggestions, setSuggestions] = useState({ users: [], hashtags: [] });
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    sort: 'latest'
  });
  const [activeTab, setActiveTab] = useState('users');
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.length > 1) {
        performSearch();
        fetchSuggestions();
      } else if (query.length === 0) {
        setResults({ users: [], posts: [], messages: [] });
        setSuggestions({ users: [], hashtags: [] });
        setShowSuggestions(true);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [query, searchType, filters]);

  const performSearch = async () => {
    if (query.length < 2) return;
    setLoading(true);
    setShowSuggestions(false);
    try {
      const params = {
        q: query,
        type: searchType,
        limit: 20,
        ...(filters.sort && filters.sort !== 'latest' && { sort: filters.sort }),
        ...(filters.from && { from: filters.from }),
        ...(filters.to && { to: filters.to })
      };
      const { data } = await advancedSearch(params);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    if (query.length < 2) return;
    try {
      const { data } = await getSearchSuggestions(query);
      setSuggestions(data);
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.name) {
      setQuery(suggestion.name);
    } else if (suggestion.startsWith('#')) {
      setQuery(suggestion);
    }
    setShowSuggestions(false);
  };

  const handleMessageClick = (chatId, otherUser) => {
    window.openChatWithUser = otherUser;
    window.dispatchEvent(new CustomEvent('openChat', { detail: { user: otherUser, chatId } }));
    onClose();
    navigate('/');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const highlightText = (text, searchQuery) => {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} style={{ background: '#4ecdc4', color: '#1e1e2e', padding: '0 2px', borderRadius: '4px' }}>{part}</mark> : part
    );
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '60px'
    }}>
      <div ref={searchRef} style={{
        width: '800px',
        maxWidth: '90%',
        maxHeight: '80vh',
        background: '#1e1e2e',
        borderRadius: '28px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: '#2d2d3a',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '22px' }}>
            <i className="fas fa-search" style={{ marginRight: '12px', color: '#4ecdc4' }}></i>
            Advanced Search
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            background: '#3a3a4a',
            borderRadius: '60px',
            padding: '4px 8px 4px 20px',
            alignItems: 'center'
          }}>
            <i className="fas fa-search" style={{ color: '#888' }}></i>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users, posts, messages, hashtags..."
              style={{
                flex: 1,
                padding: '14px 0',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '15px',
                outline: 'none'
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          {/* Suggestions */}
          {showSuggestions && query.length > 1 && (suggestions.users?.length > 0 || suggestions.hashtags?.length > 0) && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#2d2d3a',
              borderRadius: '16px'
            }}>
              {suggestions.users?.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px', paddingLeft: '8px' }}>Users</div>
                  {suggestions.users.map(user => (
                    <div
                      key={user._id}
                      onClick={() => handleSuggestionClick(user)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#3a3a4a'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4ecdc4&color=fff&size=32`}
                        alt="avatar"
                        style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                      />
                      <span style={{ color: 'white' }}>{user.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {suggestions.hashtags?.length > 0 && (
                <div>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px', paddingLeft: '8px' }}>Hashtags</div>
                  {suggestions.hashtags.map(tag => (
                    <div
                      key={tag}
                      onClick={() => handleSuggestionClick(tag)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#3a3a4a'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ color: '#4ecdc4' }}>{tag}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Type Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            {['all', 'users', 'posts', 'messages'].map(type => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                style={{
                  padding: '6px 16px',
                  background: searchType === type ? '#4ecdc4' : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '20px',
                  color: searchType === type ? '#1e1e2e' : 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: searchType === type ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Filters */}
          {(searchType === 'posts' || searchType === 'all') && (
            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: '16px',
              flexWrap: 'wrap',
              padding: '12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-calendar" style={{ color: '#888', fontSize: '12px' }}></i>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                  style={{
                    background: '#2d2d3a',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                />
                <span style={{ color: '#888' }}>to</span>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                  style={{
                    background: '#2d2d3a',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                />
              </div>
              <select
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                style={{
                  background: '#2d2d3a',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  color: 'white',
                  fontSize: '12px'
                }}
              >
                <option value="latest">Latest</option>
                <option value="likes">Most Liked</option>
                <option value="comments">Most Commented</option>
              </select>
            </div>
          )}
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '40px' }}></i>
              <p style={{ marginTop: '16px' }}>Searching...</p>
            </div>
          ) : (
            <>
              {/* Users Results */}
              {(searchType === 'all' || searchType === 'users') && results.users?.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '18px' }}>
                    <i className="fas fa-users" style={{ marginRight: '8px', color: '#4ecdc4' }}></i>
                    Users ({results.users.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {results.users.map(user => (
                      <Link
                        key={user._id}
                        to={`/profile/${user._id}`}
                        onClick={onClose}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '20px',
                          textDecoration: 'none',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      >
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4ecdc4&color=fff&size=48`}
                          alt="avatar"
                          style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
                            {highlightText(user.name, query)}
                          </div>
                          {user.bio && (
                            <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
                              {user.bio.substring(0, 80)}...
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '11px', color: '#666' }}>
                            <span><i className="fas fa-user-friends"></i> {user.followers?.length || 0} followers</span>
                            <span><i className="fas fa-user-plus"></i> {user.following?.length || 0} following</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts Results */}
              {(searchType === 'all' || searchType === 'posts') && results.posts?.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '18px' }}>
                    <i className="fas fa-newspaper" style={{ marginRight: '8px', color: '#4ecdc4' }}></i>
                    Posts ({results.posts.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {results.posts.map(post => (
                      <Link
                        key={post._id}
                        to={`/post/${post._id}`}
                        onClick={onClose}
                        style={{
                          display: 'block',
                          padding: '16px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '20px',
                          textDecoration: 'none',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <img
                            src={post.user?.avatar || `https://ui-avatars.com/api/?name=${post.user?.name}&background=4ecdc4&color=fff&size=32`}
                            alt="avatar"
                            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                          />
                          <div>
                            <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{post.user?.name}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>{formatDate(post.createdAt)}</div>
                          </div>
                        </div>
                        <p style={{ color: '#e4e4e4', fontSize: '14px', lineHeight: '1.5', marginBottom: '12px' }}>
                          {highlightText(post.content, query)}
                        </p>
                        {post.image && (
                          <img
                            src={post.image}
                            alt="post"
                            style={{ width: '100%', maxHeight: '200px', borderRadius: '12px', objectFit: 'cover', marginTop: '8px' }}
                          />
                        )}
                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#666' }}>
                          <span><i className="fas fa-heart"></i> {post.likes?.length || 0}</span>
                          <span><i className="fas fa-comment"></i> {post.comments?.length || 0}</span>
                          <span><i className="fas fa-share-alt"></i> {post.shares || 0}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Results */}
              {(searchType === 'all' || searchType === 'messages') && results.messages?.length > 0 && (
                <div>
                  <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '18px' }}>
                    <i className="fas fa-comments" style={{ marginRight: '8px', color: '#4ecdc4' }}></i>
                    Messages ({results.messages.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {results.messages.map(msg => (
                      <div
                        key={msg._id}
                        onClick={() => handleMessageClick(msg.chatId, msg.otherUser)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      >
                        <img
                          src={msg.otherUser?.avatar || `https://ui-avatars.com/api/?name=${msg.otherUser?.name}&background=4ecdc4&color=fff&size=48`}
                          alt="avatar"
                          style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>{msg.otherUser?.name}</div>
                          <div style={{ color: '#aaa', fontSize: '13px', marginTop: '4px' }}>
                            {msg.isCall ? (
                              <span><i className="fas fa-phone"></i> Call log</span>
                            ) : msg.mediaType ? (
                              <span><i className="fas fa-paperclip"></i> Media message</span>
                            ) : (
                              highlightText(msg.text, query)
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{formatDate(msg.createdAt)}</div>
                        </div>
                        <i className="fas fa-chevron-right" style={{ color: '#888' }}></i>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loading && query.length > 1 && results.users?.length === 0 && results.posts?.length === 0 && results.messages?.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                  <i className="fas fa-search" style={{ fontSize: '50px', marginBottom: '16px', opacity: 0.5 }}></i>
                  <p>No results found for "{query}"</p>
                  <p style={{ fontSize: '13px', marginTop: '8px' }}>Try searching for something else</p>
                </div>
              )}

              {query.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                  <i className="fas fa-search" style={{ fontSize: '50px', marginBottom: '16px', opacity: 0.5 }}></i>
                  <p>Search for users, posts, or messages</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;