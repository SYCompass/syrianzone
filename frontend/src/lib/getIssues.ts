/* =====================================================
   TYPES
===================================================== */

/**
 * Issue
 * Represents a single issue used in the UI and matrix.
 */
export type Issue = {
  id: string;        // Unique identifier
  title: string;     // Issue title
  category: string;  // Category name (used for filtering)
};

/**
 * SheetRow
 * Represents the raw row structure coming from Google Sheets.
 * (Same shape as Issue, but kept separate for clarity)
 */
type SheetRow = {
  id: string;
  title: string;
  category: string;
};

/* =====================================================
   DATA FETCH FUNCTION
===================================================== */

/**
 * Fetches issues from a public Google Sheets JSON endpoint
 * and converts them into Issue objects used by the app.
 */
export async function getIssues(): Promise<Issue[]> {
  // Read the Google Sheet URL from environment variables
  const url = process.env.NEXT_PUBLIC_ISSUES_SHEET_URL;

  // Safety check to avoid runtime errors
  if (!url) {
    throw new Error("NEXT_PUBLIC_ISSUES_SHEET_URL is not defined");
  }

  // Fetch data from Google Sheets
  const res = await fetch(url);

  // Handle HTTP errors
  if (!res.ok) {
    throw new Error("Failed to fetch Google Sheet data");
  }

  /**
   * The response is already a clean JSON array
   * coming directly from Google Sheets
   */
  const data: SheetRow[] = await res.json();

  /**
   * Normalize data into Issue objects
   * - Ensure id is always a string
   * - Use index as fallback if id is missing
   */
  return data.map((row, index) => ({
    id: row.id?.toString() ?? String(index),
    title: row.title,
    category: row.category,
  }));
}
