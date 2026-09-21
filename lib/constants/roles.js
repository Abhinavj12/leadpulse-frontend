export const ROLES = Object.freeze({
  MANAGER: "campaign_manager",
  EXECUTIVE: "executive",
  CLIENT: "client"
});

export const roleHome = (role) => {
  switch (role) {
    case ROLES.MANAGER:
      return "/manager/dashboard";
    case ROLES.EXECUTIVE:
      return "/executive/dashboard";
    case ROLES.CLIENT:
      return "/client/dashboard";
    default:
      return "/login";
  }
};
