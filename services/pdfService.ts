import { generateFeatureImportanceHTML } from '@/components/report/FeatureImportanceChart';
import { VoiceRecording } from '@/types/recording';
import { RiskAnalysis } from '@/types/risk';
import { UserProfile } from '@/types/user';
import { EnhancedRiskAnalysis } from '@/utils/DiagnosticEngine';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface SBARReport {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
}

const RISK_COLORS = {
  LOW: '#a18cd1',
  MODERATE: '#FFB75E',
  HIGH: '#FF6B6B',
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

function generateHTML(
  profile: UserProfile,
  analysis: RiskAnalysis,
  sbar: SBARReport,
  recordings: VoiceRecording[]
): string {
  const riskColor = RISK_COLORS[analysis.riskLevel];
  const generatedDate = formatDate(new Date());

  // Get feature importance if available (XAI)
  const featureImportance = (analysis as EnhancedRiskAnalysis).featureImportance || [];
  const featureHTML = featureImportance.length > 0
    ? generateFeatureImportanceHTML(featureImportance)
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #333;
      padding: 40px;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #a18cd1;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #1a0b2e;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 14px;
      color: #666;
    }
    .generated-date {
      font-size: 12px;
      color: #999;
      margin-top: 8px;
    }
    .risk-banner {
      background: ${riskColor};
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .risk-score {
      font-size: 48px;
      font-weight: 700;
    }
    .risk-score-label {
      font-size: 14px;
      opacity: 0.9;
    }
    .risk-level {
      font-size: 20px;
      font-weight: 600;
      text-align: right;
    }
    .risk-level-label {
      font-size: 12px;
      opacity: 0.9;
    }
    .section {
      margin-bottom: 24px;
      padding: 20px;
      background: #fafafa;
      border-radius: 8px;
      border-left: 4px solid #a18cd1;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #a18cd1;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    .section-content {
      font-size: 14px;
      color: #333;
      white-space: pre-line;
    }
    .biomarkers {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .biomarker {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      text-align: center;
    }
    .biomarker-value {
      font-size: 18px;
      font-weight: 700;
      color: #1a0b2e;
    }
    .biomarker-label {
      font-size: 10px;
      color: #666;
      margin-top: 4px;
    }
    .disclaimer {
      margin-top: 32px;
      padding: 16px;
      background: #fff3cd;
      border-radius: 8px;
      font-size: 11px;
      color: #856404;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      font-size: 10px;
      color: #999;
    }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">LUNAFLOW</div>
    <div class="subtitle">Clinical Health Assessment</div>
    <div class="generated-date">Generated: ${generatedDate}</div>
  </div>

  <div class="risk-banner">
    <div>
      <div class="risk-score">${analysis.riskScore}</div>
      <div class="risk-score-label">Risk Score (0-100)</div>
    </div>
    <div style="text-align: right;">
      <div class="risk-level">${analysis.riskLevel}</div>
      <div class="risk-level-label">Probability Classification</div>
    </div>
  </div>

  <div class="biomarkers">
    <div class="biomarker">
      <div class="biomarker-value">${analysis.vocalJitter.toFixed(3)}%</div>
      <div class="biomarker-label">Vocal Jitter</div>
    </div>
    <div class="biomarker">
      <div class="biomarker-value">${analysis.contributingFactors.length}</div>
      <div class="biomarker-label">Risk Factors</div>
    </div>
    <div class="biomarker">
      <div class="biomarker-value">${analysis.estimatedPhase || 'N/A'}</div>
      <div class="biomarker-label">Cycle Phase</div>
    </div>
    <div class="biomarker">
      <div class="biomarker-value">${calculateBMICategory(profile)}</div>
      <div class="biomarker-label">BMI Category</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Situation</div>
    <div class="section-content">${sbar.situation}</div>
  </div>

  <div class="section">
    <div class="section-title">Background</div>
    <div class="section-content">${sbar.background}</div>
  </div>

  ${featureHTML}

  <div class="section">
    <div class="section-title">Assessment</div>
    <div class="section-content">${sbar.assessment}</div>
  </div>

  <div class="section">
    <div class="section-title">Recommendation</div>
    <div class="section-content">${sbar.recommendation}</div>
  </div>

  <div class="disclaimer">
    <strong>Clinical Disclaimer:</strong> This report is generated by LUNAFLOW (AI-Assist). It identifies patterns consistent with PCOS/Endometriosis but DOES NOT constitute a medical diagnosis. The risk assessment is based on limited biometric data and should be interpreted by a qualified healthcare provider.
  </div>

  <div class="footer">
    <p>LUNAFLOW • Privacy-First Women's Health • End-to-End Encrypted</p>
    <p>Report ID: ${Date.now().toString(36).toUpperCase()} | Model Version: 1.0.0</p>
  </div>
</body>
</html>
  `;
}

export async function generatePDFReport(
  profile: UserProfile,
  analysis: RiskAnalysis,
  sbar: SBARReport,
  recordings: VoiceRecording[]
): Promise<string> {
  try {
    const html = generateHTML(profile, analysis, sbar, recordings);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Health Report',
        UTI: 'com.adobe.pdf',
      });
    }

    return uri;
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
}

export async function previewPDFReport(
  profile: UserProfile,
  analysis: RiskAnalysis,
  sbar: SBARReport,
  recordings: VoiceRecording[]
): Promise<void> {
  try {
    const html = generateHTML(profile, analysis, sbar, recordings);
    await Print.printAsync({ html });
  } catch (error) {
    console.error('Failed to preview PDF:', error);
    throw error;
  }
}