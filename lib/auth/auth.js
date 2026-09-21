import { roleHome } from "@/lib/constants/roles";

export const getApiErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const data = error?.response?.data;

  if (Array.isArray(data?.details) && data.details.length > 0) {
    return data.details[0]?.message || fallback;
  }

  return data?.message || fallback;
};

export const getFieldErrors = (error) => {
  const details = error?.response?.data?.details;
  if (!Array.isArray(details)) return {};

  return details.reduce((errors, item) => {
    if (item?.field) errors[item.field] = item.message;
    return errors;
  }, {});
};

export const redirectForRole = (router, role) => {
  router.replace(roleHome(role));
};
