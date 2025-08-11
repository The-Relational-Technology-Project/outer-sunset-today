export interface VenueEvent {
  id: string;
  title: string;
  startTime: Date;
  venue: string;
  category: string;
}

export async function fetchVenueEvents(csvUrl: string, venueName: string): Promise<VenueEvent[]> {
  try {
    console.log(`Fetching events for ${venueName} from:`, csvUrl);
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    console.log('CSV Text (first 500 chars):', csvText.substring(0, 500));
    
    const events = parseVenueCSV(csvText, venueName);
    console.log(`Parsed ${events.length} events for ${venueName}:`, events);
    return events;
  } catch (error) {
    console.error('Error fetching venue events:', error);
    return [];
  }
}

function parseVenueCSV(csvText: string, venueName: string): VenueEvent[] {
  console.log(`Processing CSV for ${venueName}`);
  
  // Split CSV into proper rows, handling multi-line values
  const rows = parseCSVRows(csvText);
  console.log(`Found ${rows.length} rows after proper CSV parsing`);
  
  if (rows.length === 0) return [];
  
  const headers = rows[0];
  console.log('CSV Headers:', headers);
  
  const titleIndex = headers.findIndex(h => h.toLowerCase().includes('event title') || h.toLowerCase().includes('title'));
  // Look for "Date" column specifically, not "Date (GMT)" 
  const dateIndex = headers.findIndex(h => h.toLowerCase() === 'date');
  const timeIndex = headers.findIndex(h => h.toLowerCase().includes('time'));
  const locationIndex = headers.findIndex(h => h.toLowerCase().includes('location'));
  
  console.log('Column indices:', { titleIndex, dateIndex, timeIndex, locationIndex });
  
  const events: VenueEvent[] = [];
  const now = new Date();
  console.log('Current time:', now);
  
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    console.log(`Row ${i} values:`, values);
    console.log(`Row ${i} length check: ${values.length} >= ${Math.max(titleIndex, dateIndex, timeIndex, locationIndex) + 1}`);
    
    if (values.length < Math.max(titleIndex, dateIndex, timeIndex, locationIndex) + 1) {
      console.log(`Skipping row ${i} - insufficient columns`);
      continue;
    }
    
    const title = values[titleIndex]?.trim();
    const dateStr = values[dateIndex]?.trim();
    const timeStr = values[timeIndex]?.trim();
    const location = values[locationIndex]?.trim() || venueName;
    
    if (!title || !dateStr || !timeStr) {
      console.log(`Skipping row ${i} - missing data:`, { title, dateStr, timeStr });
      continue;
    }
    
    console.log(`Processing row ${i}:`, { title, dateStr, timeStr, location });
    const startTime = parseEventDateTime(dateStr, timeStr);
    console.log(`Parsed startTime for "${title}":`, startTime);
    
    if (!startTime || startTime <= now) {
      console.log(`Filtering out event "${title}" - startTime:`, startTime, 'vs now:', now);
      continue;
    }
    
    events.push({
      id: `${venueName.toLowerCase().replace(/\s+/g, '-')}-${i}-${startTime.getTime()}`,
      title,
      startTime,
      venue: location,
      category: 'business'
    });
  }
  
  return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.trim().split('\n');
  let currentRow: string[] = [];
  let inQuotes = false;
  let currentField = '';
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim().replace(/^"|"$/g, ''));
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // If we're not in quotes, this line ends the current row
    if (!inQuotes) {
      currentRow.push(currentField.trim().replace(/^"|"$/g, ''));
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      // Add line break to current field since we're inside quotes
      currentField += '\n';
    }
  }
  
  // Handle any remaining row
  if (currentRow.length > 0 || currentField) {
    if (currentField) currentRow.push(currentField.trim().replace(/^"|"$/g, ''));
    if (currentRow.length > 0) rows.push(currentRow);
  }
  
  return rows;
}

function parseEventDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    // Handle various date formats
    const cleanDateStr = dateStr.replace(/['"]/g, '').trim();
    const cleanTimeStr = timeStr.replace(/['"]/g, '').replace(/\n/g, ' ').trim();
    
    if (!cleanDateStr || !cleanTimeStr) return null;
    
    console.log('Parsing date/time:', { cleanDateStr, cleanTimeStr });
    
    // Extract start time from range (e.g., "07:00 PM - 09:00 PM" -> "07:00 PM")
    const startTimeMatch = cleanTimeStr.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    const startTime = startTimeMatch ? startTimeMatch[1].trim() : cleanTimeStr;
    
    // Handle format like "Wed, 13 Aug" - add current year
    const currentYear = new Date().getFullYear();
    let fullDateStr = cleanDateStr;
    
    // If date doesn't include a year, add current year
    if (!/\d{4}/.test(cleanDateStr)) {
      // Handle formats like "Wed, 13 Aug" or "13 Aug" 
      const dateWithYear = cleanDateStr.includes(',') 
        ? cleanDateStr.replace(/,\s*/, `, ${currentYear}, `)
        : `${cleanDateStr} ${currentYear}`;
      fullDateStr = dateWithYear;
    }
    
    console.log('Attempting to parse:', `${fullDateStr} ${startTime}`);
    
    // Try parsing the combined date/time string
    const dateTime = new Date(`${fullDateStr} ${startTime}`);
    
    if (!isNaN(dateTime.getTime())) {
      console.log('Successfully parsed date:', dateTime);
      return dateTime;
    }
    
    // Alternative parsing for MM/DD/YYYY format
    const parts = cleanDateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const month = parseInt(parts[0]) - 1;
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      
      if (year > 1900 && month >= 0 && month < 12 && day > 0 && day <= 31) {
        const parsedDate = new Date(year, month, day);
        const timeMatch = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const ampm = timeMatch[3]?.toUpperCase();
          
          if (ampm === 'PM' && hours !== 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          
          parsedDate.setHours(hours, minutes);
          console.log('Successfully parsed alternative format:', parsedDate);
          return parsedDate;
        }
      }
    }
    
    console.log('Failed to parse date/time');
    return null;
  } catch (error) {
    console.error('Error parsing date/time:', error);
    return null;
  }
}