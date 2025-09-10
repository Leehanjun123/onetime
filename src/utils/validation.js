const validator = {
  // Email validation
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone validation (Korean format)
  isPhoneNumber: (phone) => {
    const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
    return phoneRegex.test(phone.replace(/-/g, ''));
  },

  // Password strength validation
  isStrongPassword: (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Sanitize HTML to prevent XSS
  sanitizeHtml: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  // SQL injection prevention
  sanitizeSql: (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove SQL keywords and special characters
    return input
      .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE|SCRIPT|JAVASCRIPT)\b)/gi, '')
      .replace(/[;'"\\]/g, '');
  },

  // Korean name validation
  isKoreanName: (name) => {
    const koreanNameRegex = /^[가-힣]{2,10}$/;
    return koreanNameRegex.test(name);
  },

  // Business registration number validation (Korean)
  isBusinessNumber: (number) => {
    const cleaned = number.replace(/-/g, '');
    if (cleaned.length !== 10) return false;
    
    const checkSum = [1, 3, 7, 1, 3, 7, 1, 3, 5];
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * checkSum[i];
    }
    
    sum += Math.floor(parseInt(cleaned[8]) * 5 / 10);
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return checkDigit === parseInt(cleaned[9]);
  },

  // Input length validation
  isValidLength: (input, min, max) => {
    if (typeof input !== 'string') return false;
    return input.length >= min && input.length <= max;
  },

  // URL validation
  isUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Date validation
  isValidDate: (date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  },

  // Age validation (must be 18+)
  isAdult: (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1 >= 18;
    }
    
    return age >= 18;
  },

  // Wage validation (Korean won)
  isValidWage: (wage) => {
    const wageNum = parseInt(wage);
    const minWage = 9860; // 2024 minimum wage per hour
    const maxWage = 1000000; // Reasonable max wage per day
    
    return !isNaN(wageNum) && wageNum >= minWage && wageNum <= maxWage;
  },

  // Category validation
  isValidCategory: (category) => {
    const validCategories = [
      'CONSTRUCTION',
      'INTERIOR',
      'LOGISTICS',
      'FACTORY',
      'CLEANING',
      'DELIVERY',
      'RESTAURANT',
      'CAFE',
      'RETAIL',
      'OFFICE',
      'EVENT',
      'EDUCATION',
      'OTHER'
    ];
    
    return validCategories.includes(category);
  },

  // Location validation (Korean cities)
  isValidLocation: (location) => {
    const validLocations = [
      '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
      '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
    ];
    
    return validLocations.some(loc => location.includes(loc));
  }
};

module.exports = validator;