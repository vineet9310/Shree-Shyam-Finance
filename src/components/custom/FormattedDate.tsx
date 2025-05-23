
"use client";
import { useState, useEffect } from 'react';

interface FormattedDateProps {
  dateString?: string;
  options?: Intl.DateTimeFormatOptions;
  fallback?: string;
}

const FormattedDate: React.FC<FormattedDateProps> = ({ dateString, options, fallback = "..." }) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    if (dateString) {
      try {
        // Check if dateString is a valid date representation
        const dateObj = new Date(dateString);
        if (isNaN(dateObj.getTime())) {
          setFormattedDate("Invalid Date");
        } else {
          setFormattedDate(dateObj.toLocaleDateString(undefined, options));
        }
      } catch (e) {
        console.error("Error formatting date:", dateString, e);
        setFormattedDate("Invalid Date"); // Fallback for unexpected errors
      }
    } else {
      setFormattedDate(null); // Explicitly null if no date string is provided
    }
  }, [dateString, options]);

  if (!dateString && fallback === "...") { // If no date string and using default fallback, render nothing or a specific "N/A"
    return null; 
  }

  return <>{formattedDate === null ? fallback : formattedDate}</>;
};

export default FormattedDate;
