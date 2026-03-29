// Form validation utilities
export const validators = {
  email: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) ? null : 'Invalid email format';
  },

  password: (password) => {
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain uppercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain number';
    return null;
  },

  name: (name) => {
    if (!name || name.trim().length < 2) return 'Name must be at least 2 characters';
    return null;
  },

  amount: (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return 'Amount must be greater than 0';
    if (num > 1000000) return 'Amount cannot exceed 1,000,000';
    return null;
  },

  percentage: (value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 1 || num > 100) return 'Percentage must be between 1 and 100';
    return null;
  },

  companyName: (name) => {
    if (!name || name.trim().length < 2) return 'Company name must be at least 2 characters';
    return null;
  },
};

export const validateForm = (formData, validationRules) => {
  const errors = {};
  Object.entries(validationRules).forEach(([field, validator]) => {
    const error = validator(formData[field]);
    if (error) errors[field] = error;
  });
  return errors;
};
