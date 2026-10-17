// Legends Leasing serves a single campus: The University of Alabama.
export const SCHOOL = {
  name: "University of Alabama",
  fullName: "The University of Alabama",
  short: "UA",
  nickname: "Crimson Tide",
  city: "Tuscaloosa",
  state: "AL",
  emailDomains: ["crimson.ua.edu", "ua.edu"],
};

// A UA student email must end in one of the accepted UA domains.
export function isSchoolEmail(email) {
  const match = String(email || "").trim().toLowerCase().match(/@([^@\s]+)$/);
  return !!match && SCHOOL.emailDomains.includes(match[1]);
}