import { GoogleGenerativeAI } from '@google/generative-ai';
import { browser } from '$app/environment';

const CACHE_PREFIX = 'ai_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

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

export async function validateRoadmapRequest(params) {
    const errors = [];
    
    if (!params.syllabusText && !params.subject) {
        errors.push('Either syllabus text or subject is required');
    }

    if (params.timeline) {
        const validTimelines = ['1 week', '2 weeks', '1 month', '2 months', '3 months', '6 months'];
        if (!validTimelines.includes(params.timeline)) {
            errors.push('Invalid timeline specified');
        }
    }

    if (params.difficulty) {
        const validDifficulties = ['beginner', 'intermediate', 'advanced'];
        if (!validDifficulties.includes(params.difficulty)) {
            errors.push('Invalid difficulty level');
        }
    }

    return errors;
}

export async function generateLearningRoadmap(params) {
    const errors = await validateRoadmapRequest(params);
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }

    const cacheKey = `roadmap_${btoa((params.syllabusText || params.subject).slice(0, 100))}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        Generate a detailed list of topics based on the following requirements:

        Syllabus: ${params.syllabusText}
        Subject: ${params.subject}
        Class Level: ${params.classLevel || 'college'}
        Target Exam: ${params.exam || 'general'}
        Difficulty Level: ${params.difficulty || 'intermediate'}
        Desired Timeline: ${params.timeline || '1 month'}
        Prior Knowledge: ${params.priorKnowledge || 'none'}

        Consider the difficulty, timeline, and prior knowledge when deciding the depth and breadth of topics
        and subtopics. Adjust the estimated completion time for each topic based on the overall timeline and difficulty.

        Each topic should contain:
        - name: Name of the topic
        - description: Brief explanation (1-2 sentences)
        - subtopics: List of important sub-concepts
        - completion_time: Estimated days to complete
        - resources: List of recommended reading materials or online resources
        - order: Sequential order in the learning path

        Format the response as a JSON object with this structure:
        {
            "modules": [
                {
                    "title": "topic name",
                    "description": "brief explanation",
                    "keyTopics": ["subtopic1", "subtopic2", ...],
                    "resources": ["resource1", "resource2", ...],
                    "estimatedDuration": "X days",
                    "order": number
                }
            ]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        
        let parsed = JSON.parse(text.replace('```json', '').replace('```', ''));
        saveToCache(cacheKey, parsed);
        return parsed;
    } catch (error) {
        console.error('Error generating roadmap:', error);
        throw error;
    }
}

export async function validateFlashcardRequest(params) {
    const errors = [];
    
    if (!params.topic) {
        errors.push('Topic is required');
    }

    if (params.difficulty && !['beginner', 'intermediate', 'advanced'].includes(params.difficulty)) {
        errors.push('Invalid difficulty level');
    }

    return errors;
}

export async function generateFlashcards(topic, difficulty = 'intermediate', numCards = 10) {
    const errors = await validateFlashcardRequest({ topic, difficulty, numCards });
    if (errors.length > 0) {
        console.log("errors", errors);
        throw new Error(errors.join(', '));
    }

    const cacheKey = `flashcards_${btoa(topic)}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        Generate ${numCards} flashcards on the topic '${topic}' with difficulty '${difficulty}'.
        Follow these guidelines for maximum retention:
        1. Use active recall
        2. Phrase questions to promote thinking, not memorization
        3. One concept per card
        4. Keep prompts short and clear
        5. Include 'why', 'how', or 'when' questions
        6. Use fill-in-the-blank style for definitions and formulas
        7. Mix different aspects of the topic

        Format as JSON:
        {
            "flashcards": [
                {
                    "front_content": "question",
                    "back_content": "answer",
                    "hint": "optional hint"
                }
            ]
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log("flashcards response from gemini : ", response);
        const parsed = JSON.parse(response.text().replace('```json', '').replace('```', ''));
        console.log("parsed flashcards response from gemini : ", parsed);

        // return the flashcard in the form of an array of objects
        const flashcards = parsed.flashcards.map(card => ({
            front_content: card.front_content,
            back_content: card.back_content,
            hint: card.hint || ''
        }));

        console.log("flashcards generated (ai.js) : ", flashcards);

        saveToCache(cacheKey, parsed);
        return parsed;

    } catch (error) {
        console.error('Error generating flashcards:', error);
        throw error;
    }
}