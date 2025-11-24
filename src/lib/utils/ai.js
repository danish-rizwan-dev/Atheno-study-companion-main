import { browser } from '$app/environment';

const CACHE_PREFIX = 'ai_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// API Key is injected by the environment
const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

function getFromCache(key) {
    if (!browser) return null;
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
    }

    return data;
}

function saveToCache(key, data) {
    if (!browser) return;
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
    }));
}

async function callGeminiAPI(prompt) {
    const delays = [1000, 2000, 4000, 8000, 16000];
    
    for (let i = 0; i <= delays.length; i++) {
        try {
            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            };

            const response = await fetch(`${API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!text) throw new Error("No content generated");

            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);

        } catch (error) {
            if (i === delays.length) throw error;
            await new Promise(resolve => setTimeout(resolve, delays[i]));
        }
    }
}

export async function validateRoadmapRequest(params) {
    const errors = [];
    if (!params.syllabusText && !params.subject) errors.push('Either syllabus text or subject is required');
    return errors;
}

export async function generateLearningRoadmap(params) {
    const errors = await validateRoadmapRequest(params);
    if (errors.length > 0) throw new Error(errors.join(', '));

    const syllabusText = typeof params === 'string' ? params : params.syllabusText;
    const subject = typeof params === 'string' ? 'General Topic' : params.subject;
    
    const cacheKey = `roadmap_${btoa((syllabusText || subject || '').slice(0, 100))}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
        // Updated prompt to explicitly request YouTube Links in resources
        const prompt = `
        Generate a detailed learning path based on:
        Syllabus/Topic: ${syllabusText || subject}
        Class Level: ${params.classLevel || 'college'}
        Difficulty: ${params.difficulty || 'intermediate'}
        Timeline: ${params.timeline || '1 month'}
        
        Create a list of modules. For EACH module, you MUST include:
        1. "title": Clear topic name
        2. "description": Short explanation
        3. "keyTopics": Array of 3-5 sub-concepts
        4. "resources": Array of strings. IMPORTANT: One of these strings MUST be a YouTube search URL (e.g., "https://www.youtube.com/results?search_query=Calculus+Limits+tutorial") or a direct video link relevant to the topic.
        5. "estimatedDuration": e.g., "2 hours"
        6. "learningObjectives": Array of 2-3 goals
        7. "order": Sequential number

        Format as JSON:
        {
            "modules": [
                {
                    "title": "...",
                    "description": "...",
                    "keyTopics": ["..."],
                    "resources": ["https://www.youtube.com/results?search_query=...", "Article link..."],
                    "estimatedDuration": "...",
                    "order": 1,
                    "learningObjectives": ["..."]
                }
            ]
        }
        `;

        const parsed = await callGeminiAPI(prompt);
        saveToCache(cacheKey, parsed);
        return parsed;
    } catch (error) {
        console.error('Error generating roadmap:', error);
        throw error;
    }
}

export async function validateFlashcardRequest(params) {
    const errors = [];
    if (!params.topic && !params.content) errors.push('Topic or content is required');
    return errors;
}

export async function generateFlashcards(topic, content = '', difficulty = 'intermediate', numCards = 10) {
    if (typeof topic === 'object' && topic !== null) {
        const p = topic;
        topic = p.topic; content = p.content || ''; difficulty = p.difficulty || 'intermediate'; numCards = p.numCards || 10;
    }

    const errors = await validateFlashcardRequest({ topic, content, difficulty, numCards });
    if (errors.length > 0) throw new Error(errors.join(', '));

    const cacheKey = `flashcards_${btoa((topic + content).slice(0, 100))}_${numCards}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
        const prompt = `
        Generate ${numCards} flashcards on '${topic}' (Difficulty: ${difficulty}).
        ${content ? `Context: ${content.slice(0, 1000)}...` : ''}
        
        JSON Format:
        {
            "flashcards": [
                { "front_content": "Question", "back_content": "Answer", "hint": "Hint" }
            ]
        }`;

        const parsed = await callGeminiAPI(prompt);
        
        // Normalize structure
        const flashcards = {
            flashcards: parsed.flashcards.map(card => ({
                front_content: card.front_content,
                back_content: card.back_content,
                hint: card.hint || ''
            }))
        };

        saveToCache(cacheKey, flashcards);
        return flashcards;

    } catch (error) {
        console.error('Error generating flashcards:', error);
        throw error;
    }
}