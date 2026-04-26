/**
 * Shared utility — single source of truth for agency experience computation.
 * Takes a founded_year (number|string|null) and a language code.
 * Returns a formatted string, or null if founded_year is empty/invalid.
 */
export function computeAgencyExperience(founded_year, lang = "fr") {
  if (!founded_year) return null;
  const year = parseInt(founded_year, 10);
  if (isNaN(year)) return null;

  const currentYear = new Date().getFullYear();
  const experience = currentYear - year;

  if (experience < 0) return null; // future year — invalid

  const isLongEstablished = experience >= 50;

  let label;
  if (experience === 0) {
    label = lang === "ar" ? "وكالة جديدة" : lang === "fr" ? "Nouvelle agence" : "New agency";
  } else if (experience === 1) {
    label = lang === "ar" ? "سنة واحدة من الخبرة" : lang === "fr" ? "1 an d'expérience" : "1 year of experience";
  } else {
    label = lang === "ar"
      ? `${experience} سنوات من الخبرة`
      : lang === "fr"
      ? `${experience} ans d'expérience`
      : `${experience} years of experience`;
  }

  return { label, experience, isLongEstablished };
}