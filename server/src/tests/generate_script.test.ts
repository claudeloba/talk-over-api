
import { describe, expect, it } from 'bun:test';
import { generateScript } from '../handlers/generate_script';

describe('generateScript', () => {
  it('should generate a script with default medium duration', async () => {
    const result = await generateScript('artificial intelligence');

    expect(result.content).toBeDefined();
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.keywords).toBeInstanceOf(Array);
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.estimated_duration).toBeGreaterThan(0);
    expect(typeof result.estimated_duration).toBe('number');
    
    // Should contain the topic in the content
    expect(result.content.toLowerCase()).toContain('artificial intelligence');
  });

  it('should generate shorter script for short duration preference', async () => {
    const shortResult = await generateScript('machine learning', 'short');
    const mediumResult = await generateScript('machine learning', 'medium');

    expect(shortResult.content.length).toBeLessThan(mediumResult.content.length);
    expect(shortResult.estimated_duration).toBeLessThan(mediumResult.estimated_duration);
    expect(shortResult.estimated_duration).toBeLessThanOrEqual(40); // Around 30s target with some tolerance
  });

  it('should generate longer script for long duration preference', async () => {
    const longResult = await generateScript('data science', 'long');
    const mediumResult = await generateScript('data science', 'medium');

    expect(longResult.content.length).toBeGreaterThan(mediumResult.content.length);
    expect(longResult.estimated_duration).toBeGreaterThan(mediumResult.estimated_duration);
    expect(longResult.estimated_duration).toBeGreaterThanOrEqual(80); // Around 120s target with some tolerance
  });

  it('should extract relevant keywords from topic', async () => {
    const result = await generateScript('sustainable energy solutions');

    expect(result.keywords).toContain('sustainable');
    expect(result.keywords).toContain('energy');
    expect(result.keywords).toContain('solutions');
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.keywords.length).toBeLessThanOrEqual(8); // Reasonable limit
  });

  it('should handle single word topics', async () => {
    const result = await generateScript('blockchain');

    expect(result.content).toContain('blockchain');
    expect(result.keywords).toContain('blockchain');
    expect(result.estimated_duration).toBeGreaterThan(0);
  });

  it('should handle topics with special characters', async () => {
    const result = await generateScript('AI & Machine Learning: The Future');

    expect(result.content).toBeDefined();
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.estimated_duration).toBeGreaterThan(0);
  });

  it('should generate consistent duration estimates', async () => {
    const result1 = await generateScript('climate change', 'medium');
    const result2 = await generateScript('renewable energy', 'medium');

    // Both medium duration scripts should have similar estimated durations
    const durationDiff = Math.abs(result1.estimated_duration - result2.estimated_duration);
    expect(durationDiff).toBeLessThan(30); // Within 30 seconds of each other
  });

  it('should filter out common stop words from keywords', async () => {
    const result = await generateScript('the future of artificial intelligence and machine learning');

    expect(result.keywords).not.toContain('the');
    expect(result.keywords).not.toContain('of');
    expect(result.keywords).not.toContain('and');
    expect(result.keywords).toContain('future');
    expect(result.keywords).toContain('artificial');
    expect(result.keywords).toContain('intelligence');
  });
});
