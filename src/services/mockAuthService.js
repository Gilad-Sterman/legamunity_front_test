/**
 * Mock authentication service for testing admin functionality
 * This will be replaced with actual API calls later
 */

// Mock user data
const mockUsers = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 2,
    name: 'Regular User',
    email: 'user@example.com',
    password: 'user123',
    role: 'user'
  }
];

// Generate a mock token
const generateToken = (user) => {
  return `mock-jwt-token-${user.id}-${Date.now()}`;
};

// Mock login function
export const mockLogin = async (email, password) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const user = mockUsers.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const token = generateToken(user);
  
  // Return the user without the password and the token
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    token
  };
};

// Mock verify token function
export const mockVerifyToken = async (token) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (!token || !token.startsWith('mock-jwt-token-')) {
    throw new Error('Invalid token');
  }
  
  // Extract user ID from token
  const userId = parseInt(token.split('-')[3]);
  const user = mockUsers.find(u => u.id === userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Return the user without the password
  const { password: _, ...userWithoutPassword } = user;
  
  return userWithoutPassword;
};
