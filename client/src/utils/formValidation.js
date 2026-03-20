// utils/formValidation.js
// Shared real-time validation rules for Profile and Register forms

const LETTERS_ONLY  = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-]+$/;
const PH_PHONE      = /^(09\d{9}|\+639\d{9})$/;
const EMAIL_RE      = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_RE     = /^\d{4}$/;
const HOUSE_RE      = /^[A-Za-z0-9\s\-#\/\.]+$/;

/**
 * Returns an error string or "" if valid.
 * Pass the field name + current value.
 */
export function validateField(name, value) {
  const v = (value ?? "").trim();

  switch (name) {
    // ── Name fields ──────────────────────────────────────────────────────────
    case "firstName":
    case "lastName": {
      if (!v) return "This field is required.";
      if (!LETTERS_ONLY.test(v)) return "Only letters, spaces, hyphens, and apostrophes allowed.";
      if (v.length < 2) return "Must be at least 2 characters.";
      if (v.length > 50) return "Must be 50 characters or fewer.";
      return "";
    }
    case "middleName": {
      // Optional — validate only if filled
      if (!v) return "";
      if (!LETTERS_ONLY.test(v)) return "Only letters, spaces, hyphens, and apostrophes allowed.";
      if (v.length > 50) return "Must be 50 characters or fewer.";
      return "";
    }

    // ── Contact ──────────────────────────────────────────────────────────────
    case "email":
    case "email_reg": {
      if (!v) return "Email is required.";
      if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
      return "";
    }
    case "mobileNumber":
    case "phone": {
      if (!v) return "Phone number is required.";
      if (!PH_PHONE.test(v)) return "Must be 09XXXXXXXXX or +639XXXXXXXXX.";
      return "";
    }

    // ── Date of Birth ────────────────────────────────────────────────────────
    case "dateOfBirth":
    case "dob": {
      if (!v) return "Date of birth is required.";
      const dob   = new Date(v);
      const today = new Date();
      if (isNaN(dob.getTime())) return "Enter a valid date.";
      if (dob > today) return "Date of birth cannot be in the future.";

      // Age in full years
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

      if (age < 16)  return "You must be at least 16 years old.";
      if (age > 120) return "Please enter a realistic date of birth.";
      return "";
    }

    // ── Address ──────────────────────────────────────────────────────────────
    case "houseNumber": {
      if (!v) return "House/unit number is required.";
      if (!HOUSE_RE.test(v)) return "Invalid characters in house number.";
      if (v.length > 20) return "Must be 20 characters or fewer.";
      return "";
    }
    case "street": {
      if (!v) return "Street is required.";
      if (v.length < 3) return "Must be at least 3 characters.";
      if (v.length > 80) return "Must be 80 characters or fewer.";
      return "";
    }
    case "barangay":
    case "city": {
      if (!v) return `${name === "city" ? "City" : "Barangay"} is required.`;
      return "";
    }
    case "postalCode": {
      if (!v) return "Postal code is required.";
      if (!POSTAL_RE.test(v)) return "Postal code must be exactly 4 digits.";
      return "";
    }

    default:
      return "";
  }
}

/**
 * Validate an entire flat form object.
 * Returns { fieldName: errorString } — only fields with errors are included.
 */
export function validateAll(fields) {
  const errors = {};
  for (const [key, value] of Object.entries(fields)) {
    const err = validateField(key, value);
    if (err) errors[key] = err;
  }
  return errors;
}

/** Returns true when the errors object has no entries. */
export function isFormValid(errors) {
  return Object.keys(errors).length === 0;
}