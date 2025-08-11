export interface VenueEvent {
  id: string;
  title: string;
  startTime: Date;
  venue: string;
  category: string;
}

export async function fetchVenueEvents(csvUrl: string, venueName: string): Promise<VenueEvent[]> {
  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    return parseVenueCSV(csvText, venueName);
  } catch (error) {
    console.error('Error fetching venue events:', error);
    return [];
  }
}

function parseVenueCSV(csvText: string, venueName: string): VenueEvent[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const titleIndex = headers.findIndex(h => h.toLowerCase().includes('event title') || h.toLowerCase().includes('title'));
  const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));
  const timeIndex = headers.findIndex(h => h.toLowerCase().includes('time'));
  const locationIndex = headers.findIndex(h => h.toLowerCase().includes('location'));
  
  const events: VenueEvent[] = [];
  const now = new Date();
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < Math.max(titleIndex, dateIndex, timeIndex, locationIndex) + 1) continue;
    
    const title = values[titleIndex]?.trim();
    const dateStr = values[dateIndex]?.trim();
    const timeStr = values[timeIndex]?.trim();
    const location = values[locationIndex]?.trim() || venueName;
    
    if (!title || !dateStr || !timeStr) continue;
    
    const startTime = parseEventDateTime(dateStr, timeStr);
    if (!startTime || startTime <= now) continue;
    
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

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values.map(v => v.replace(/^"(.*)"$/, '$1'));
}

function parseEventDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    // Handle various date formats
    const cleanDateStr = dateStr.replace(/['"]/g, '').trim();
    const cleanTimeStr = timeStr.replace(/['"]/g, '').trim();
    
    if (!cleanDateStr || !cleanTimeStr) return null;
    
    // Try parsing the date string
    const dateTime = new Date(`${cleanDateStr} ${cleanTimeStr}`);
    
    if (isNaN(dateTime.getTime())) {
      // Try alternative parsing
      const parts = cleanDateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        // Assume MM/DD/YYYY or MM-DD-YYYY format
        const month = parseInt(parts[0]) - 1;
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        
        if (year > 1900 && month >= 0 && month < 12 && day > 0 && day <= 31) {
          const parsedDate = new Date(year, month, day);
          const timeMatch = cleanTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const ampm = timeMatch[3]?.toUpperCase();
            
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            
            parsedDate.setHours(hours, minutes);
            return parsedDate;
          }
        }
      }
      return null;
    }
    
    return dateTime;
  } catch (error) {
    console.error('Error parsing date/time:', error);
    return null;
  }
}