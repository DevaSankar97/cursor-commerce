import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Search, MapPin, ShoppingCart, User, Menu, Bell } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store/store';

const HeaderContainer = styled.header`
  background: #0078AD;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const TopBar = styled.div`
  background: #006494;
  padding: 4px 0;
  font-size: 12px;
  color: white;
  text-align: center;
`;

const MainHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  max-width: 1440px;
  margin: 0 auto;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: white;
  font-weight: bold;
  font-size: 24px;
  
  .logo-icon {
    width: 32px;
    height: 32px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    color: #0078AD;
    font-weight: bold;
  }
`;

const SearchSection = styled.div`
  flex: 1;
  max-width: 600px;
  margin: 0 20px;
  position: relative;
`;

const SearchContainer = styled.div`
  display: flex;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const LocationSelector = styled.button`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: none;
  background: white;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  border-right: 1px solid #e0e0e0;
  white-space: nowrap;
  
  &:hover {
    background: #f5f5f5;
  }
  
  .location-icon {
    margin-right: 8px;
    color: #0078AD;
  }
  
  .location-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    
    .quick-label {
      font-size: 10px;
      color: #666;
      line-height: 1;
    }
    
    .delivery-location {
      font-size: 12px;
      font-weight: 500;
      color: #333;
    }
  }
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  padding: 12px 16px;
  font-size: 14px;
  outline: none;
  
  &::placeholder {
    color: #999;
  }
`;

const SearchButton = styled.button`
  background: #0078AD;
  border: none;
  padding: 12px 16px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    background: #006494;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const CartButton = styled(Link)`
  position: relative;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255,255,255,0.1);
  }
  
  .cart-icon {
    margin-right: 8px;
  }
  
  .cart-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #FF4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
  }
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255,255,255,0.1);
  }
  
  .user-icon {
    margin-right: 8px;
  }
`;

const UserDropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 200px;
  z-index: 1000;
  display: ${props => props.isOpen ? 'block' : 'none'};
  margin-top: 8px;
  
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    right: 16px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid white;
  }
`;

const DropdownItem = styled(Link)`
  display: block;
  padding: 12px 16px;
  color: #333;
  text-decoration: none;
  border-bottom: 1px solid #f0f0f0;
  
  &:hover {
    background: #f5f5f5;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const CategoryNav = styled.nav`
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 20px;
`;

const CategoryList = styled.div`
  display: flex;
  align-items: center;
  max-width: 1440px;
  margin: 0 auto;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryItem = styled(Link)<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  padding: 16px 20px;
  text-decoration: none;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  
  ${props => props.isActive && `
    color: #0078AD;
    border-bottom-color: #0078AD;
  `}
  
  &:hover {
    color: #0078AD;
    background: #f8f9fa;
  }
  
  .category-icon {
    width: 24px;
    height: 24px;
    margin-right: 8px;
    border-radius: 4px;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const Header: React.FC = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Mumbai 400001');
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get user and cart state from Redux
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { items: cartItems } = useSelector((state: RootState) => state.cart);
  
  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };
  
  const categories = [
    { 
      name: 'Low Price Guarantee', 
      icon: '💰',
      path: '/category/low-price',
      isActive: true
    },
    { 
      name: 'Groceries', 
      icon: '🛒',
      path: '/category/groceries'
    },
    { 
      name: 'Half Price Store', 
      icon: '🏷️',
      path: '/category/half-price'
    },
    { 
      name: 'Biscuit Bash', 
      icon: '🍪',
      path: '/category/biscuits'
    },
    { 
      name: 'Shower Of Savings', 
      icon: '🚿',
      path: '/category/personal-care'
    },
    { 
      name: 'Home & Kitchen', 
      icon: '🏠',
      path: '/category/home-kitchen'
    },
    { 
      name: 'Coupons', 
      icon: '🎫',
      path: '/coupons'
    }
  ];
  
  return (
    <HeaderContainer>
      <TopBar>
        Free Delivery in 10 to 30 mins
        <span style={{ marginLeft: '20px', background: '#4CAF50', padding: '2px 8px', borderRadius: '12px' }}>
          ⚡Quick delivery to: Mumbai 400001 ▼
        </span>
      </TopBar>
      
      <MainHeader>
        <Logo to="/">
          <div className="logo-icon">J</div>
          JioMart
        </Logo>
        
        <SearchSection>
          <SearchContainer>
            <LocationSelector onClick={() => navigate('/location')}>
              <MapPin className="location-icon" size={16} />
              <div className="location-text">
                <div className="quick-label">⚡Quick</div>
                <div className="delivery-location">delivery to: {selectedLocation}</div>
              </div>
            </LocationSelector>
            
            <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1 }}>
              <SearchInput
                type="text"
                placeholder="Search In Quick"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <SearchButton type="submit">
                <Search size={18} />
              </SearchButton>
            </form>
          </SearchContainer>
        </SearchSection>
        
        <RightSection>
          <CartButton to="/cart">
            <ShoppingCart className="cart-icon" size={20} />
            {cartItemsCount > 0 && (
              <span className="cart-badge">{cartItemsCount}</span>
            )}
          </CartButton>
          
          <UserMenu ref={userMenuRef}>
            <UserButton onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
              <User className="user-icon" size={20} />
              {isAuthenticated ? user?.firstName : 'Sign In'}
            </UserButton>
            
            <UserDropdown isOpen={isUserMenuOpen}>
              {isAuthenticated ? (
                <>
                  <DropdownItem to="/profile">My Profile</DropdownItem>
                  <DropdownItem to="/orders">My Orders</DropdownItem>
                  <DropdownItem to="/wishlist">Wishlist</DropdownItem>
                  <DropdownItem to="/addresses">Addresses</DropdownItem>
                  <DropdownItem to="/logout">Sign Out</DropdownItem>
                </>
              ) : (
                <>
                  <DropdownItem to="/login">Sign In</DropdownItem>
                  <DropdownItem to="/register">Create Account</DropdownItem>
                </>
              )}
            </UserDropdown>
          </UserMenu>
          
          <MobileMenuButton>
            <Menu size={20} />
          </MobileMenuButton>
        </RightSection>
      </MainHeader>
      
      <CategoryNav>
        <CategoryList>
          {categories.map((category, index) => (
            <CategoryItem 
              key={index} 
              to={category.path}
              isActive={category.isActive}
            >
              <div className="category-icon">{category.icon}</div>
              {category.name}
            </CategoryItem>
          ))}
        </CategoryList>
      </CategoryNav>
    </HeaderContainer>
  );
};

export default Header;