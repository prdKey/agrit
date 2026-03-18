/**
 * Redirect user based on their role
 * @param {string} role - user role
 */
export const redirectByRole = (role) => {
  switch (role) {
    case "USER":
      window.location.href = "/";      // client marketplace
      break;
    case "SELLER":
      window.location.href = "/seller/dashboard";  // seller dashboard
      break;
    case "ADMIN":
      window.location.href = "/admin/dashboard";   // admin dashboard
      break;
    case "LOGISTICS":
      window.location.href = "/logistics/dashboard"; // logistics dashboard
      break;
    default:
      window.location.href = "/"; // fallback
  }
};
