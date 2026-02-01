import { RiskAnalysis } from '@/types/risk';
import { UserProfile } from '@/types/user';

// 1. Access the environment variable
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are a Clinical Informatics Specialist. Your task is to draft an SBAR report based on Clarity biometric data.

Strict Constraints:
1. Use professional, clinical terminology.
2. Maintain a neutral, investigative tone.
3. DO NOT provide a definitive diagnosis.
4. Format specifically for a gynecological specialist.
5. Reference the specific biomarkers provided.

OUTPUT FORMAT:
You must output PURE JSON with keys: situation, background, assessment, recommendation. Do not include markdown formatting.`;

export interface SBARReport {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
}

// Helper: Anonymize data (Same as before)
function anonymizeData(profile: UserProfile, analysis: RiskAnalysis) {
  return {
    riskScore: analysis.riskScore,
    riskLevel: analysis.riskLevel,
    vocalJitter: analysis.vocalJitter,
    cycleRegularity: profile.cycleRegularity,
    physicalMarkers: profile.physicalMarkers,
    familyHistory: profile.familyHistory === 'yes',
    bmiCategory: calculateBMICategory(profile),
    contributingFactors: analysis.contributingFactors.map(f => ({
      label: f.label,
      category: f.category,
      points: f.points,
    })),
    estimatedPhase: analysis.estimatedPhase,
  };
}

// Helper: BMI Calculation (Same as before)
function calculateBMICategory(profile: UserProfile): string {
  let heightCm: number | undefined;
  let weightKg: number | undefined;

  if (profile.height?.cm) {
    heightCm = profile.height.cm;
  } else if (profile.height?.feet !== undefined && profile.height?.inches !== undefined) {
    heightCm = (profile.height.feet * 12 + profile.height.inches) * 2.54;
  }

  if (profile.weight?.kg) {
    weightKg = profile.weight.kg;
  } else if (profile.weight?.lbs) {
    weightKg = profile.weight.lbs * 0.453592;
  }

  if (!heightCm || !weightKg) return 'Unknown';

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

// Helper: Build User Prompt (Same as before)
function buildUserPrompt(anonymizedData: ReturnType<typeof anonymizeData>): string {
  const topFactors = anonymizedData.contributingFactors
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map(f => f.label);

  const jitterTrend = anonymizedData.vocalJitter < 0.5
    ? 'within normal range'
    : anonymizedData.vocalJitter < 1.0
      ? 'mildly elevated'
      : 'significantly elevated';

  return `
Patient Biometric Summary (Anonymized):
- Risk Score: ${anonymizedData.riskScore}/100 (${anonymizedData.riskLevel})
- Primary Indicators: ${topFactors.join(', ')}
- Menstrual Pattern: ${anonymizedData.cycleRegularity || 'Not specified'}
- Vocal Jitter Coefficient: ${anonymizedData.vocalJitter.toFixed(3)}% (${jitterTrend})
- BMI Classification: ${anonymizedData.bmiCategory}
- Physical Markers Present: ${anonymizedData.physicalMarkers.length > 0 ? anonymizedData.physicalMarkers.join(', ') : 'None reported'}
- Family History of PCOS/hormonal conditions: ${anonymizedData.familyHistory ? 'Positive' : 'Negative/Unknown'}
- Current Cycle Phase Estimate: ${anonymizedData.estimatedPhase || 'Unknown'}

Generate an SBAR (Situation, Background, Assessment, Recommendation) report for gynecological review. Format your response as a valid JSON object.`;
}

// --- MAIN FUNCTION ---
export async function generateNarrative(
  analysis: RiskAnalysis,
  profile: UserProfile,
  apiKeyOverride?: string
): Promise<SBARReport> {

  // 1. STRICT KEY CHECK
  // We prioritize the override, then the env var. If neither exists, we CRASH.
  const keyToUse = apiKeyOverride || GEMINI_API_KEY;

  if (!keyToUse) {
    // This will now throw an error to the UI, allowing you to show an alert or toast
    throw new Error("MISSING_API_KEY: A valid Google Gemini API key is required to generate this report.");
  }

  try {
    const anonymizedData = anonymizeData(profile, analysis);
    const userPrompt = buildUserPrompt(anonymizedData);

    const url = `${BASE_URL}?key=${keyToUse}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.2,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsed = JSON.parse(content);

    // Validate the shape of the data before returning
    if (!parsed.situation || !parsed.background || !parsed.assessment || !parsed.recommendation) {
       throw new Error("Incomplete report generated. Missing SBAR sections.");
    }

    return {
      situation: parsed.situation,
      background: parsed.background,
      assessment: parsed.assessment,
      recommendation: parsed.recommendation,
    };

  } catch (error: any) {
    // 2. STRICT ERROR HANDLING
    // We do NOT fallback to local. We re-throw the error so the UI knows it failed.
    console.error('Narrative Generation Failed:', error);
    throw error; 
  }
}

export function formatSBARForDisplay(sbar: SBARReport): string {
  return `SITUATION
${sbar.situation}

BACKGROUND
${sbar.background}

ASSESSMENT
${sbar.assessment}

RECOMMENDATION
${sbar.recommendation}`;
}