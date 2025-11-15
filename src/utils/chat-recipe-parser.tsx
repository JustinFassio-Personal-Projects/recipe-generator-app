import React from 'react';

/**
 * Detects if text contains recipe content by looking for common recipe section headers
 * @param text - The text to check
 * @returns true if recipe content is detected
 */
export function hasRecipeContent(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const lowerText = text.toLowerCase();

  // Check for recipe section headers
  const recipeSectionPatterns = [
    /ingredient/i,
    /instruction/i,
    /step/i,
    /method/i,
    /cooking step/i,
    /directions/i,
    /preparation/i,
    /prep/i,
  ];

  // Check if any recipe section pattern is found
  const hasSectionHeader = recipeSectionPatterns.some((pattern) =>
    pattern.test(lowerText)
  );

  // Also check for numbered steps (1., 2., etc.) which indicate instructions
  const hasNumberedSteps = /\d+\.\s+/.test(text);

  return hasSectionHeader || hasNumberedSteps;
}

/**
 * Parses instructions from text, extracting instruction steps as individual array elements
 * Each step is a separate field (like setup), not joined together
 * @param text - The text to parse
 * @returns Object with hasInstructions flag and array of instruction steps
 */
export function parseInstructionsFromText(text: string): {
  hasInstructions: boolean;
  instructionLines: string[];
} {
  if (!text || typeof text !== 'string') {
    return { hasInstructions: false, instructionLines: [] };
  }

  const lines = text.split('\n').map((line) => line.trim());
  const instructionSteps: string[] = [];

  let inInstructionsSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Detect instruction section headers (skip the header itself)
    if (
      lowerLine.includes('instruction') ||
      lowerLine.includes('step') ||
      lowerLine.includes('method') ||
      lowerLine.includes('cooking step') ||
      lowerLine.includes('directions') ||
      lowerLine.match(/^#{1,6}\s+.*(?:instruction|step|method|direction)/i) // Markdown headers
    ) {
      inInstructionsSection = true;
      // Don't include the header line - just mark that we're in instructions section
      continue;
    }

    // If we're in an instructions section, collect instruction steps
    if (inInstructionsSection) {
      // Stop if we hit another major section (like Notes, Tips, etc.)
      if (
        (lowerLine.includes('note') && !lowerLine.includes('instruction')) ||
        (lowerLine.includes('tip') && !lowerLine.includes('step')) ||
        lowerLine.includes('serving') ||
        lowerLine.includes('variation') ||
        (lowerLine.match(/^#{1,6}\s+/) &&
          !lowerLine.match(
            /^#{1,6}\s+.*(?:instruction|step|method|direction)/i
          ))
      ) {
        // Don't break immediately - check if it's a subsection within instructions
        // (like "**Step 1:**" which should be included)
        if (!lowerLine.match(/step\s+\d+/i)) {
          break;
        }
      }

      // Skip empty lines and section headers
      if (!line.trim()) continue;
      if (line.startsWith('**') && line.endsWith('**')) continue;

      // Split by periods (.) if the line contains periods
      // This handles "Step 1. Do this. Step 2. Do that."
      if (line.includes('.')) {
        // Use lookahead to avoid capturing whitespace in split result
        const periodSteps = line
          .split(/\.(?=\s+|$)/)
          .map((step) => step.trim())
          .filter((step) => step.length > 0);

        for (const step of periodSteps) {
          const cleanedStep = step.replace(/^\d+\.\s*/, '').trim();
          if (cleanedStep.length > 3) {
            instructionSteps.push(cleanedStep);
          }
        }
      } else {
        // Clean the step: remove number prefix (we'll number them in display)
        const cleanedStep = line.replace(/^\d+\.\s*/, '').trim();

        // Only add if it's a meaningful step (not just formatting)
        if (cleanedStep.length > 3) {
          instructionSteps.push(cleanedStep);
        }
      }
    } else {
      // Check if this line looks like a numbered instruction step (even without section header)
      // This handles cases where instructions start directly with numbered steps
      const numberedStepMatch = line.match(/^\d+\.\s+(.+)$/);
      if (numberedStepMatch && i > 0) {
        // If we find numbered steps and we haven't entered instructions section yet,
        // start collecting from here
        inInstructionsSection = true;
        const cleanedStep = numberedStepMatch[1].trim();
        if (cleanedStep.length > 3) {
          instructionSteps.push(cleanedStep);
        }
      }
    }
  }

  // If we found instruction steps, return them
  if (instructionSteps.length > 0) {
    return { hasInstructions: true, instructionLines: instructionSteps };
  }

  return { hasInstructions: false, instructionLines: [] };
}

/**
 * Formats instruction lines as React nodes matching RecipeView's display pattern
 * Uses amber/yellow/cream colors to match "similar item" badge styling
 * @param instructionLines - Array of instruction line strings
 * @returns Array of React nodes for rendering
 */
export function formatInstructionsForDisplay(
  instructionLines: string[]
): React.ReactNode[] {
  if (!instructionLines || instructionLines.length === 0) {
    return [];
  }

  const formattedNodes: React.ReactNode[] = [];
  let stepNumber = 0; // Track step numbers for auto-numbering

  instructionLines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      return;
    }

    // Check if it's a section header (starts with ** or markdown header)
    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      formattedNodes.push(
        <div key={`header-${index}`} className="mt-4 first:mt-0">
          <h5 className="text-base font-semibold text-gray-800">
            {trimmedLine.replace(/\*\*/g, '')}
          </h5>
        </div>
      );
      return;
    }

    // Check for markdown headers (## Header)
    const markdownHeaderMatch = trimmedLine.match(/^#{1,6}\s+(.+)$/);
    if (markdownHeaderMatch) {
      formattedNodes.push(
        <div key={`header-${index}`} className="mt-4 first:mt-0">
          <h5 className="text-base font-semibold text-gray-800">
            {markdownHeaderMatch[1]}
          </h5>
        </div>
      );
      return;
    }

    // Check if it's a numbered step - extract the number and use it
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.+)$/);
    if (numberedMatch) {
      stepNumber = parseInt(numberedMatch[1], 10);
      formattedNodes.push(
        <div key={`step-${index}`} className="flex items-start">
          <div className="mt-0.5 mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
            <span className="text-xs font-semibold text-amber-800">
              {numberedMatch[1]}
            </span>
          </div>
          <p className="pt-0.5 text-sm leading-relaxed text-gray-800">
            {numberedMatch[2]}
          </p>
        </div>
      );
      return;
    }

    // Number all other instruction lines (EXACTLY like Setup & Preparation)
    // Skip very short lines that are likely formatting artifacts
    // Use yellow/brown (amber) colors to differentiate from ingredients/setup
    if (trimmedLine.length > 3) {
      stepNumber++;
      formattedNodes.push(
        <div key={`step-${index}`} className="flex items-start">
          <div className="mt-0.5 mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
            <span className="text-xs font-semibold text-amber-800">
              {stepNumber}
            </span>
          </div>
          <p className="pt-0.5 text-sm leading-relaxed text-gray-800">
            {trimmedLine}
          </p>
        </div>
      );
    }
  });

  return formattedNodes;
}
