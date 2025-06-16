
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { generateTTSAudio } from '../handlers/generate_tts_audio';

describe('generateTTSAudio', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Set up environment variables for testing
    process.env['ELEVENLABS_API_KEY'] = 'test-api-key';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should generate TTS audio with default voice', async () => {
    const scriptContent = 'Hello, this is a test script for TTS generation.';
    
    // Mock the fetch API for testing
    const originalFetch = global.fetch;
    global.fetch = Object.assign(
      async (input: string | Request | URL, init?: any) => {
        const url = typeof input === 'string' ? input : input.toString();
        expect(url).toContain('text-to-speech');
        expect(init.method).toBe('POST');
        expect(init.headers['xi-api-key']).toBe('test-api-key');
        
        const body = JSON.parse(init.body);
        expect(body.text).toBe(scriptContent);
        expect(body.model_id).toBe('eleven_monolingual_v1');
        
        return {
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(1024) // Mock audio data
        } as Response;
      },
      { preconnect: () => {} }
    );

    const result = await generateTTSAudio(scriptContent);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toContain('tts_');
    expect(result).toContain('.mp3');
    
    // Restore fetch
    global.fetch = originalFetch;
  });

  it('should generate TTS audio with custom voice', async () => {
    const scriptContent = 'This is a test with a custom voice.';
    const customVoiceId = 'custom-voice-id-123';
    
    // Mock the fetch API
    const originalFetch = global.fetch;
    global.fetch = Object.assign(
      async (input: string | Request | URL, init?: any) => {
        const url = typeof input === 'string' ? input : input.toString();
        expect(url).toContain(customVoiceId);
        
        return {
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(1024)
        } as Response;
      },
      { preconnect: () => {} }
    );

    const result = await generateTTSAudio(scriptContent, customVoiceId);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    
    // Restore fetch
    global.fetch = originalFetch;
  });

  it('should throw error for empty script content', async () => {
    await expect(generateTTSAudio('')).rejects.toThrow(/script content is required/i);
    await expect(generateTTSAudio('   ')).rejects.toThrow(/script content is required/i);
  });

  it('should throw error when API key is missing', async () => {
    delete process.env['ELEVENLABS_API_KEY'];
    
    const scriptContent = 'Test script content';
    
    await expect(generateTTSAudio(scriptContent)).rejects.toThrow(/ELEVENLABS_API_KEY.*required/i);
  });

  it('should handle API errors gracefully', async () => {
    const scriptContent = 'Test script that will fail';
    
    // Mock fetch to return error
    const originalFetch = global.fetch;
    global.fetch = Object.assign(
      async (input: string | Request | URL, init?: any) => {
        return {
          ok: false,
          status: 400,
          text: async () => 'Bad Request: Invalid voice ID'
        } as Response;
      },
      { preconnect: () => {} }
    );

    await expect(generateTTSAudio(scriptContent)).rejects.toThrow(/ElevenLabs API error.*400/i);
    
    // Restore fetch
    global.fetch = originalFetch;
  });

  it('should handle network errors', async () => {
    const scriptContent = 'Test script for network error';
    
    // Mock fetch to throw network error
    const originalFetch = global.fetch;
    global.fetch = Object.assign(
      async (input: string | Request | URL, init?: any) => {
        throw new Error('Network error: Connection timeout');
      },
      { preconnect: () => {} }
    );

    await expect(generateTTSAudio(scriptContent)).rejects.toThrow(/Network error/i);
    
    // Restore fetch
    global.fetch = originalFetch;
  });

  it('should use correct voice settings', async () => {
    const scriptContent = 'Testing voice settings configuration';
    
    // Mock fetch to capture request details
    const originalFetch = global.fetch;
    global.fetch = Object.assign(
      async (input: string | Request | URL, init?: any) => {
        const body = JSON.parse(init.body);
        
        expect(body.voice_settings).toBeDefined();
        expect(body.voice_settings.stability).toBe(0.5);
        expect(body.voice_settings.similarity_boost).toBe(0.5);
        expect(body.voice_settings.style).toBe(0.0);
        expect(body.voice_settings.use_speaker_boost).toBe(true);
        
        return {
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(1024)
        } as Response;
      },
      { preconnect: () => {} }
    );

    await generateTTSAudio(scriptContent);
    
    // Restore fetch
    global.fetch = originalFetch;
  });
});
