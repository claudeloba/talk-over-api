
import { type ScriptGeneration } from '../schema';

export const generateScript = async (
  topic: string, 
  durationPreference?: 'short' | 'medium' | 'long'
): Promise<ScriptGeneration> => {
  try {
    // Duration mapping: short=30s, medium=60s, long=120s
    const durationMap = {
      short: 30,
      medium: 60,
      long: 120
    };

    const targetDuration = durationMap[durationPreference || 'medium'];

    // Generate script content based on topic and duration
    // In a real implementation, this would call an LLM API like OpenAI GPT
    const wordsPerSecond = 2.5; // Average speaking rate
    const targetWordCount = Math.floor(targetDuration * wordsPerSecond);

    // Generate content based on duration preference
    let content = '';
    
    if (durationPreference === 'short') {
      content = generateShortScript(topic);
    } else if (durationPreference === 'long') {
      content = generateLongScript(topic);
    } else {
      // Medium duration (default)
      content = generateMediumScript(topic);
    }

    // Extract keywords from the topic
    const keywords = extractKeywords(topic);

    // Calculate estimated duration based on word count
    const wordCount = content.split(' ').length;
    const estimatedDuration = Math.round(wordCount / wordsPerSecond);

    return {
      content,
      keywords,
      estimated_duration: estimatedDuration
    };
  } catch (error) {
    console.error('Script generation failed:', error);
    throw error;
  }
};

function generateShortScript(topic: string): string {
  return `Welcome to this video about ${topic}. Here are the key points you should know about ${topic}. This information can help you understand ${topic} better. Thanks for watching and don't forget to subscribe!`;
}

function generateMediumScript(topic: string): string {
  return `Welcome to this video about ${topic}. Let's explore the key aspects of ${topic} and understand why it matters. Here are the main points you should know about ${topic}. Understanding ${topic} is important because it affects many areas of our lives. This information about ${topic} can help you in practical ways. We'll cover the essential concepts and applications of ${topic}. Thanks for watching this overview of ${topic}. Don't forget to subscribe for more content like this!`;
}

function generateLongScript(topic: string): string {
  return `Welcome to this comprehensive video about ${topic}. Today we're going to dive deep into understanding ${topic} and explore why it's so important in today's world. Let's start by exploring the fundamental concepts behind ${topic} and how it has evolved over time. 

The history of ${topic} shows us how far we've come and where we might be heading. There are several key aspects of ${topic} that we need to understand to get the full picture. First, let's look at the basic principles that govern ${topic} and how these principles apply in real-world situations.

${topic} has significant implications across multiple industries and sectors. The impact of ${topic} extends far beyond what we initially see on the surface. When we examine ${topic} closely, we discover numerous applications and use cases that affect our daily lives. Understanding ${topic} thoroughly requires looking at multiple perspectives and considering various factors that influence its development and application.

The future of ${topic} looks promising, with new developments and innovations emerging regularly. Experts in the field of ${topic} continue to push boundaries and discover new possibilities. As we move forward, ${topic} will likely play an increasingly important role in shaping our world.

In conclusion, ${topic} represents a fascinating area of study and application. The knowledge we've covered today about ${topic} provides a solid foundation for further exploration. Whether you're a beginner or someone with experience in ${topic}, there's always more to learn and discover. Thanks for watching this comprehensive overview of ${topic}. Don't forget to subscribe for more in-depth content like this, and let us know in the comments what aspects of ${topic} you'd like us to explore next!`;
}

// Helper function to extract keywords from topic
function extractKeywords(topic: string): string[] {
  // Simple keyword extraction - split on common separators and filter
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'];
  
  const words = topic
    .toLowerCase()
    .split(/[\s,.-]+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 5); // Limit to 5 keywords

  // Add some related terms based on common patterns
  const relatedTerms: string[] = [];
  
  if (topic.toLowerCase().includes('technology') || topic.toLowerCase().includes('tech')) {
    relatedTerms.push('innovation', 'digital');
  }
  
  if (topic.toLowerCase().includes('health') || topic.toLowerCase().includes('fitness')) {
    relatedTerms.push('wellness', 'lifestyle');
  }
  
  if (topic.toLowerCase().includes('business') || topic.toLowerCase().includes('marketing')) {
    relatedTerms.push('strategy', 'growth');
  }

  return [...new Set([...words, ...relatedTerms])]; // Remove duplicates
}
