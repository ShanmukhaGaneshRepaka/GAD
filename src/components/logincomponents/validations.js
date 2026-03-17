
 export const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email is required.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? "" : "Please enter a valid email address.";
  };
  export const validatePassword = (password) => {
    if (!password.trim()) {
      return "Password is required.";
    }

    return "";
  };

  export const isMobileNumberValid = (mobilenumber) => {
    if (!mobilenumber.trim()) {
      return "Please enter a valid 10 digit mobile number";
    }
    if (!/^\d+$/.test(mobilenumber)) {
      return "Mobile number must contain only numeric digits.";
    }
    if (mobilenumber.length !== 10) {
      return "Please enter a valid 10 digit mobile number";
    }
    if (/\s/.test(mobilenumber)) {
      return "Mobile number cannot contain spaces.";
    }
    const firstDigit = mobilenumber.charAt(0);
    if (!["6", "7", "8", "9"].includes(firstDigit)) {
      return "Mobile number should begin with 6, 7, 8, or 9.";
    }
    return "";
  };

  export  const isPasswordValid = (password) => {
    if (!password.trim()) {
      return "Password is required.";
    }
    // Regular expression to match the password criteria
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

    if (!passwordRegex.test(password)) {
      return "Password must be at least 6 characters long, contain at least one uppercase letter, one lowercase letter, one number, one special character, and no spaces.";
    }

    return "";
  };

  export const SNACKBAR_PROPS={
    open: false,
    message: "",
    type: "",
  }

  export const ALLOWED_DOMAINS = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "aol.com",
      "mail.com",
      "icloud.com",
      "zoho.com",
      "yandex.com",
      "protonmail.com",
      "tutanota.com",
    ];


  export const isEmailValid = (email) => {
    if (!email.trim()) {
      return "Email is required.";
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|org)$/i;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }

    const domain = email.trim().toLowerCase().split("@")[1];

    if (!ALLOWED_DOMAINS.includes(domain)) {
      return "Please enter a valid email address";
    }

    return "";
  };
  export const UTM_DEFAULTS = {
  source:   "bitlabs.in/jobs",
  medium:   "bitlabs.in/jobs",
  campaign: "bitlabs.in/jobs",
  content:  "bitlabs.in/jobs",
  term:     "bitlabs.in/jobs",
};

   export const isFullNameValid = (fullName) => {
      if (!fullName.trim()) {
        return "Full name is required.";
      }
      if (!/^[a-zA-Z\s]+$/.test(fullName)) {
        return "Please enter a valid full name and should not have any numbers and special char.";
      }
      if (fullName.trim().length < 3) {
        return "Full name should be at least three characters long.";
      }
      return "";
    };

  