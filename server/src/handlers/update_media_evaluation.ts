
import { db } from '../db';
import { mediaItemsTable } from '../db/schema';
import { type MediaEvaluation, type MediaItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMediaEvaluation = async (input: MediaEvaluation): Promise<MediaItem> => {
  try {
    // Update the media item with evaluation data
    const result = await db.update(mediaItemsTable)
      .set({
        suitability_score: input.suitability_score,
        suitability_reason: input.suitability_reason,
      })
      .where(eq(mediaItemsTable.id, input.media_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Media item with id ${input.media_id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Media evaluation update failed:', error);
    throw error;
  }
};
