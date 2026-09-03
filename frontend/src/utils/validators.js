// src/utils/validators.js — Comprehensive form validation utilities for PitchNepal

/**
 * Validates an email address
 * @param {string} email
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email address is required' }
  }
  const cleanEmail = email.trim()
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@example.com)' }
  }
  return { isValid: true, error: '' }
}

/**
 * Validates a person's name (strictly disallows numbers)
 * @param {string} name
 * @param {string} [fieldName='Full Name']
 * @param {number} [minLength=2]
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateName(name, fieldName = 'Full Name', minLength = 2) {
  if (!name || !name.trim()) {
    return { isValid: false, error: `${fieldName} is required` }
  }
  const clean = name.trim()
  if (clean.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` }
  }
  if (/\d/.test(clean)) {
    return { isValid: false, error: `${fieldName} cannot contain numbers` }
  }
  // Allow letters, spaces, hyphens, periods, and apostrophes
  const nameRegex = /^[a-zA-Z\s.'-]+$/
  if (!nameRegex.test(clean)) {
    return { isValid: false, error: `${fieldName} can only contain letters and standard name characters` }
  }
  return { isValid: true, error: '' }
}

/**
 * Validates a password and computes strength
 * @param {string} password
 * @param {number} [minLength=6]
 * @returns {{ isValid: boolean, error: string, score: number, label: string, color: string, checks: { length: boolean, hasNumber: boolean, hasLetter: boolean, hasSpecial: boolean } }}
 */
export function validatePassword(password, minLength = 6) {
  if (!password) {
    return {
      isValid: false,
      error: 'Password is required',
      score: 0,
      label: 'Too short',
      color: 'var(--red-500, #ef4444)',
      checks: { length: false, hasNumber: false, hasLetter: false, hasSpecial: false },
    }
  }

  const lengthOk = password.length >= minLength
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)

  let score = 0
  if (lengthOk) score += 1
  if (hasLetter && hasNumber) score += 1
  if (password.length >= 8) score += 1
  if (hasSpecial) score += 1

  let label = 'Weak'
  let color = '#ef4444' // red
  if (score === 2) {
    label = 'Fair'
    color = '#f59e0b' // amber
  } else if (score === 3) {
    label = 'Good'
    color = '#3b82f6' // blue
  } else if (score >= 4) {
    label = 'Strong'
    color = '#10b981' // green
  }

  if (!lengthOk) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters`,
      score,
      label,
      color,
      checks: { length: lengthOk, hasNumber, hasLetter, hasSpecial },
    }
  }

  return {
    isValid: true,
    error: '',
    score,
    label,
    color,
    checks: { length: lengthOk, hasNumber, hasLetter, hasSpecial },
  }
}

/**
 * Validates confirm password against original password
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' }
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' }
  }
  return { isValid: true, error: '' }
}

/**
 * Validates Nepal phone numbers (e.g. 98XXXXXXXX, 97XXXXXXXX, 96XXXXXXXX, or optional +977 prefix, or landlines)
 * @param {string} phone
 * @param {boolean} [required=true]
 * @returns {{ isValid: boolean, error: string }}
 */
export function validatePhone(phone, required = true) {
  if (!phone || !phone.trim()) {
    if (required) return { isValid: false, error: 'Phone number is required' }
    return { isValid: true, error: '' }
  }
  const clean = phone.trim().replace(/[\s-]/g, '')
  // Nepal Mobile regex: +977 or 977 optional, followed by 98, 97, or 96 and 8 digits (10 digits total)
  // Or Kathmandu / regional landlines: 01XXXXXXX (8 digits)
  const mobileRegex = /^(?:\+?977)?(9[678]\d{8})$/
  const landlineRegex = /^(?:\+?977)?(0\d{1,2}\d{6,7})$/

  if (!mobileRegex.test(clean) && !landlineRegex.test(clean)) {
    return { isValid: false, error: 'Please enter a valid 10-digit Nepal mobile number (e.g. 98XXXXXXXX)' }
  }
  return { isValid: true, error: '' }
}

/**
 * Validates product price and discount price
 * @param {number|string} price
 * @param {number|string} [discountPrice]
 * @returns {{ isValid: boolean, error: string }}
 */
export function validatePrice(price, discountPrice = null) {
  const numPrice = Number(price)
  if (price === '' || isNaN(numPrice) || numPrice <= 0) {
    return { isValid: false, error: 'Price must be a positive number greater than 0' }
  }
  if (discountPrice !== null && discountPrice !== '' && discountPrice !== undefined) {
    const numDisc = Number(discountPrice)
    if (isNaN(numDisc) || numDisc < 0) {
      return { isValid: false, error: 'Discount price cannot be negative' }
    }
    if (numDisc >= numPrice) {
      return { isValid: false, error: 'Discount price must be less than regular price' }
    }
  }
  return { isValid: true, error: '' }
}

/**
 * Validates stock quantity
 * @param {number|string} stock
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateStock(stock) {
  const numStock = Number(stock)
  if (stock === '' || isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
    return { isValid: false, error: 'Stock must be a non-negative integer (0 or more)' }
  }
  return { isValid: true, error: '' }
}

/**
 * Validates required text field with minimum length
 * @param {string} text
 * @param {string} fieldName
 * @param {number} [minLength=2]
 * @param {number} [maxLength=1000]
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateRequiredText(text, fieldName = 'This field', minLength = 2, maxLength = 1000) {
  if (!text || !text.trim()) {
    return { isValid: false, error: `${fieldName} is required` }
  }
  const clean = text.trim()
  if (clean.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` }
  }
  if (clean.length > maxLength) {
    return { isValid: false, error: `${fieldName} cannot exceed ${maxLength} characters` }
  }
  return { isValid: true, error: '' }
}
