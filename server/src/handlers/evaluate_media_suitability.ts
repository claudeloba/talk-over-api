
import { db } from '../db';
import { mediaItemsTable } from '../db/schema';
import { type MediaEvaluation } from '../schema';
import { eq } from 'drizzle-orm';

export const evaluateMediaSuitability = async (mediaUrl: string, scriptContent: string, keyword: string): Promise<MediaEvaluation> => {
  try {
    // Find the media item by URL and keyword
    const mediaItems = await db.select()
      .from(mediaItemsTable)
      .where(eq(mediaItemsTable.url, mediaUrl))
      .execute();

    if (mediaItems.length === 0) {
      throw new Error('Media item not found');
    }

    const mediaItem = mediaItems[0];

    // Simple heuristic-based evaluation for now
    // In a real implementation, this would call a vision LLM API
    let suitabilityScore = 50; // Base score
    let suitabilityReason = 'Basic evaluation completed';

    // Keyword relevance check
    const lowerKeyword = keyword.toLowerCase();
    const lowerScript = scriptContent.toLowerCase();
    
    if (lowerScript.includes(lowerKeyword)) {
      suitabilityScore += 20;
      suitabilityReason = `Good match: keyword '${keyword}' found in script content`;
    } else {
      suitabilityScore -= 10;
      suitabilityReason = `Partial match: keyword '${keyword}' not directly mentioned in script`;
    }

    // Media type bonus
    if (mediaItem.type === 'video') {
      suitabilityScore += 15;
      suitabilityReason += '. Video content provides dynamic visual appeal';
    } else if (mediaItem.type === 'gif') {
      suitabilityScore += 10;
      suitabilityReason += '. Animated content adds engagement';
    }

    // Source reliability bonus
    if (mediaItem.source === 'pexels') {
      suitabilityScore += 5;
      suitabilityReason += '. High-quality source';
    }

    // Ensure score is within bounds
    suitabilityScore = Math.max(0, Math.min(100, suitabilityScore));

    // Update the media item with the evaluation
    await db.update(mediaItemsTable)
      .set({
        suitability_score: suitabilityScore,
        suitability_reason: suitabilityReason,
      })
      .where(eq(mediaItemsTable.id, mediaItem.id))
      .execute();

    return {
      media_id: mediaItem.id,
      suitability_score: suitabilityScore,
      suitability_reason: suitabilityReason,
    };
  } catch (error) {
    console.error('Media suitability evaluation failed:', error);
    throw error;
  }
};
