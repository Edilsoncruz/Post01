import { GoogleGenAI } from "@google/genai";
import { StrategyResponse, GenerationMode, MentorshipResult, Scene, VideoJsonOutput, MarketingInputs } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

/**
 * Helper to clean JSON string from Markdown code blocks and potential garbage
 * Handles both Objects {} and Arrays []
 * Also strips comments to prevent JSON parsing errors
 */
const cleanJsonString = (text: string): string => {
  if (!text) return "{}";
  
  // Remove markdown code blocks like ```json ... ```
  let clean = text.replace(/```json/gi, "").replace(/```/g, "");
  
  // Remove single line comments // ... (Assuming prompts don't contain URLs with //)
  clean = clean.replace(/\/\/.*$/gm, "");
  
  // Remove multi-line comments /* ... */
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, "");

  // Locate start of JSON structure (Object or Array)
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');

  let start = -1;
  let end = -1;

  // Determine if it starts with { or [
  // We want the one that appears FIRST in the string
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    // It's an Object
    start = firstBrace;
    end = clean.lastIndexOf('}');
  } else if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    // It's an Array
    start = firstBracket;
    end = clean.lastIndexOf(']');
  }

  if (start !== -1 && end !== -1) {
    clean = clean.substring(start, end + 1);
  }
  
  return clean.trim();
};

export const improveInputText = async (
  currentText: string,
  fieldType: string
): Promise<string> => {
  const ai = getClient();
  
  if (!currentText || currentText.length < 3) return currentText;

  const systemInstruction = `
    Você é um especialista em Marketing Digital e Estratégia de Conteúdo.
    Sua tarefa é melhorar, expandir e profissionalizar o texto inserido pelo usuário para um campo específico de um briefing.
    
    Campo: ${fieldType}
    Idioma de Saída: Português (PT-BR)
    
    Regras:
    1. Seja direto e profissional.
    2. Use terminologia de marketing adequada.
    3. Se o texto for muito curto, expanda com inferências lógicas baseadas no contexto comum.
    4. Retorne APENAS o texto melhorado, sem aspas e sem explicações.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { text: `Melhore este texto para o campo '${fieldType}': "${currentText}"` },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text?.trim() || currentText;
  } catch (error) {
    console.error("Improve Text Error:", error);
    return currentText;
  }
};

export const generateStrategy = async (
  inputs: MarketingInputs
): Promise<StrategyResponse> => {
  const ai = getClient();
  const conceptCount = inputs.conceptCount || 3;
  
  const parts: any[] = [];
  let promptContext = "";

  // Logic Branch: Image Input vs Text Input
  if (inputs.inputType === 'image' && inputs.imagesBase64.length > 0) {
    // Image Mode
    inputs.imagesBase64.forEach(base64 => {
      parts.push({
        inlineData: { mimeType: 'image/jpeg', data: base64.split(',')[1] }
      });
    });
    promptContext = `
      Analise as imagens do produto fornecidas (diferentes ângulos) para compreender totalmente sua geometria e detalhes.
      O usuário escolheu o modo: ${inputs.mode === GenerationMode.FIDELITY ? 'FIEL AO PRODUTO' : 'EXPLORAÇÃO CRIATIVA'}.
    `;
  } else {
    // Text Mode
    promptContext = `
      O usuário não forneceu imagens, mas descreveu a ideia visualmente: "${inputs.textPrompt}".
      Crie conceitos visuais baseados estritamente nesta descrição.
      O modo será sempre EXPLORAÇÃO CRIATIVA.
    `;
  }

  const systemInstruction = `
    Você é um Diretor de Criação de Elite e Engenheiro de Prompt de Vídeo.
    ${promptContext}
    
    Gere ${conceptCount} conceitos de marketing.
    Público: ${inputs.targetAudience}. Objetivo: ${inputs.objective}.
    Diretrizes: ${inputs.guidance}.
    Formato e Proporção Selecionada: ${inputs.aspectRatio || '1:1'}.

    DIRETRIZ PARA O CAMPO 'canvaPrompt':
    Aja como um Diretor Criativo Sênior, Diretor de Fotografia e Engenheiro de Prompt de escala mundial especializado em campanhas publicitárias de alto padrão para o Canva AI 2.0.
    Sua função NÃO é descrever imagens de forma simples ou genérica. Sua função é atuar como Diretor de Arte Sênior e Especialista em Publicidade de Alta Conversão, transformando qualquer ideia de conteúdo recebida em um PROMPT PRINCIPAL CINEMATOGRÁFICO PUBLICITÁRIO PREMIUM estruturado pronto para gerar artes de altíssimo impacto e fusão estética.
    O prompt gerado deve ser extremamente detalhado, cinematográfico, fisicamente plausível, coerente e com apelo estético marcante. Evite qualquer tipo de overprompting ou competição visual de efeitos exagerados.
    Para o campo 'canvaPrompt', você deve seguir RIGOROSA e FIELMENTE a estrutura de 12 seções estruturadas descritas abaixo, preenchendo cada uma de forma rica, técnica e sem adjetivos subjetivos vagos:

    # REGRAS DE OURO DE ENGENHARIA DE PROMPT PREMIUM:
    1. REDUZIR REDUNDÂNCIA SEMÂNTICA: Evite listar múltiplos adjetivos emocionais sinônimos. Condense a direção emocional em conceitos diretos de impacto (ex: "elite athletic energy with explosive forward momentum" ou "minimalist luxury elegance with supreme calm").
    2. INSTRUÇÕES VISUAIS CONCRETAS (FÍSICA DA CENA): Nunca use abstrações vazias como "evitar amadorismo", "priorizar conversão", "causar impacto psicológico" ou "fazer com amor". A IA de imagem entende física de cena, comportamento óptico e propriedades reais da luz. Use terminologias concretas: "high-contrast focal hierarchy", "cohesive cinematic lighting", "premium commercial composition", "natural atmospheric integration", "depth-of-field control", "realistic material response", "high dynamic range lighting".
    3. CONTROLE DE DENSIDADE (EVITAR OVERPROMPTING): Quanto maior for o produto protagonista na composição central, menor deve ser a densidade de efeitos secundários (partículas, fumaça, neon, flares) para priorizar a clareza, foco absoluto, e legibilidade do post e evitar poluição visual.
    4. EVITAR MICROGERENCIAMENTO TIPOGRÁFICO EXCESSIVO: Não especifique múltiplos gradientes concorrentes, efeitos simultâneos ou fontes impossíveis de renderizar que deformem o texto. Prefira descrever a tipografia pela sua força estética, peso de contraste e fusão física no ambiente (ex: "bold modern display typography featuring subtle backlight glow and natural physical occlusion behind the hero product").
    5. DETALHAMENTO CINEMATOGRÁFICO DE FOTOGRAFIA: Utilize especificações de lentes reais e propriedades físicas para que a IA processe a composição como um frame de estúdio profissional real, tais como: "shot with an 85mm lens", "soft atmospheric haze", "cinematic rim lighting", "shallow depth of field", "volumetric dramatic light beams".
    6. REGRA DO HERO SHOT: O produto ou objeto principal deve ser o magneto visual imponente e intocável, parecendo maior, mais desejável, e integrado à cena de forma perfeita, sem parecer uma colagem.
    7. CTA E SINTONIA DE CONVERSÃO: O CTA sugerido deve estar em perfeita harmonia com o estilo de ação (ex: "Peça Agora", "Experimente", "Descubra", "Aproveite Hoje").

    # ESTRUTURA DE LAYOUT OBRIGATÓRIA (HIERARQUIA ESPACIAL)
    Instrua a montagem visual seguindo estritamente a distribuição abaixo:
    - TOPO: Título de alto impacto + Subtítulo complementar de forma limpa.
    - CENTRO: Elemento Produto HERO em destaque absoluto ocupando de 65% a 75% da área útil do design.
    - BASE: CTA de formato moderno integrado ao rodapé de forma discreta e elegante.
    - O produto HERO ultrapassa suavemente as zonas visuais inaugurando dinamismo e profundidade.

    # ESTRUTURA OBRIGATÓRIA DO PROMPT INVISÍVEL (Preencha exatamente as 12 seções abaixo com informações ricas e completas em Português)

    # 1. CONCEITO CENTRAL
    Deixe claro que se trata da criação de um Post ou Layout Publicitário profissional de altíssima conversão de redes sociais para o formato selecionado. Defina a direção emocional condensada, a sensação exata guiada e a intenção de ação dominante (ex: frescor gastronômico absoluto, luxo minimalista, alta performance esportiva).

    # 2. HERO SHOT (CENA PRINCIPAL)
    Esta seção do prompt gerado deve conter EXCLUSIVAMENTE duas ou três linhas de especificidade técnica e narrativa:
    - Orientação: Utilizar a imagem anexa selecionada para a geração publicitária de alto padrão.
    - Formato: [inserir o formato correspondente do post, ex: Quadrado (1:1), Story (9:16) ou Widescreen (16:9)]
    - Descrição da Imagem de Referência: Descrição curta do produto/cena na imagem anexa de referência, detalhando sua narrativa física real (foco absoluto no objeto).

    # 3. DIREÇÃO DE ARTE
    Definição da linguagem estética baseada em grifes renomadas. Misture referências como: publicidade cinematográfica premium, luxury commercial, anúncios da Apple, Nike, Netflix, Food Porn de altíssimo detalhe, Hyper-realism ou minimalismo refinado.

    # 4. ILUMINAÇÃO CINEMATOGRÁFICA
    Design de iluminação de elite física: luz principal, "cinematic rim lighting" com glow realista para volume tridimensional sutil, backlight suave, luz volumétrica dramática e sombras físicas de alta fidelidade para profundidade premium.

    # 5. COMPOSIÇÃO
    Composição de blockbuster publicitário: proporção exata, enquadramento cinematográfico ("shot with an 85mm lens" ou "close-up cinematográfico"), "shallow depth of field" suave para focar no elemento principal, safe areas estruturais de 15% nas bordas e hierarquia visual imponente. Deve ser extremamente explícito para manter e usar a imagem de referência fornecida pelo usuário como a base mecânica e de contexto real e inalterável do produto, aplicando refinamentos de iluminação e atmosfera descritos apenas para elevar a qualidade estética da cena, proibindo terminantemente qualquer alucinação visual que altere o design, formato ou contexto original do produto de referência.

    # 6. FUNDO E ATMOSFERA
    Descrição tridimensional do plano de fundo e da atmosfera: poeira suspensa sutil, névoa soft ("soft atmospheric haze"), vapor gastronômico sutil ou partículas aéreas leves que reforçam o produto sem causar poluição visual e mantendo respiro total.

    # 7. TEXTURAS E MICRO DETALHES
    Hiper detalhamento físico ("realistic material response"): reflexos sutis de estúdio, texturas premium palpáveis (madeira, metal, vidro, pele), gotículas de frescor condensadas se for comida/bebida, sem distorções de IA.

    # 8. PALETA DE CORES
    Definição das cores principais e secundárias de alto contraste baseadas na marca/tema. Saturação equilibrada de fotografia profissional que unifica organicamente o fundo, produto e tipografia para evitar aspecto de colagem artificial.

    # 9. TIPOGRAFIA (SE NECESSÁRIO)
    Criar Headline de altíssimo impacto visual adaptada com gatilhos psicológicos ativos baseada no 'mainHeadline', subtítulo inteligente ('secondaryText') e CTA ('ctaButton').
    Diretriz física para o Título (Headline): O título deve interagir tridimensionalmente com a cena (ex: "bold display typography featuring subtle backlighting and natural physical occlusion behind the hero product"). Evitar fontes vazadas estranhas ou caixas sólidas chapadas flutuantes atrás de blocos de texto. O texto deve parecer parte física da cena.

    # 10. EFEITOS CINEMATOGRÁFICOS
    Adicionar efeitos realistas na física da cena: "motion freeze" do instante mais dinâmico do movimento, fumaça soft aquecida, bloom suave, reflexão realística, e "high dynamic range lighting".

    # 11. QUALIDADE FINAL
    Termos de qualidade técnica para forçar a IA do Canva a dar acabamento de estúdio: "hyper realistic, cinematic advertising, ultra detailed, 8K, masterpiece, luxury commercial look, award-winning advertising, studio quality, viral social media aesthetics, emotional visual impact, premium color grading."

    # 12. BLOCO DE NEGATIVOS
    Sempre adicione no final restrições explícitas de controle visual e amadorismo: "Evitar: low quality, blurry, flat lighting, bad anatomy, cheap CGI look, oversaturated colors, artificial textures, visual pollution, amateur composition, generic advertising look, distorted elements, unrealistic proportions, solid colored text box overlays."

    REGRAS IMPORTANTES DE ADAPTAÇÃO:
    - Nunca gere templates engessados ou assuma um tema genérico. Adapte dinamicamente a linguagem visual de acordo com o assunto:
      - Se o nicho/assunto for COMIDA: priorize apetite visual e textura, adicionando brilho gastronômico, calor e contraste apetitoso estilo fast-food premium.
      - Se o nicho/assunto for TECNOLOGIA: priorize modernidade extrema e futurismo.
      - Se o nicho/assunto for LUXO: priorize sofisticação e elegância sóbria.
      - Se o nicho/assunto for INFANTIL: priorize energia vibrante e cores estimulantes.
      - Se o nicho/assunto for CORPORATIVO: priorize autoridade e limpeza visual.
      - Se o nicho/assunto for FITNESS: priorize energia dinâmica e movimento.
      - Se o nicho/assunto for SAÚDE: priorize confiança, clareza e bem-estar.
      - Se o nicho/assunto for PRODUTO físico: dê destaque absoluto, foco central e transforme-o em um HERO SHOT (cinematográfico e desejável).
    - Se houver uma imagem enviada pelo usuário, use o produto/elemento dessa imagem como elemento principal e adapte a composição a ele.
    - A saída para o 'canvaPrompt' deve conter apenas o prompt final estruturado de alta performance pronto para Canva AI 2.0 em Português (PT-BR).

    IMPORTANTE: Nos 'visualPrompts', descreva apenas a cena, iluminação e objetos. JAMAIS peça para escrever textos, logotipos ou palavras na imagem gerada.

    IDIOMAS:
    - Estratégia, Copywriting e Guias de Imagem: PORTUGUÊS (PT-BR).
    - **Video JSON Template**: MISTO.
      - Campos técnicos (camera, lighting, subject, VFX): **INGLÊS (ENGLISH)**.
      - Roteiro (script): **PORTUGUÊS (PT-BR)**.

    REGRAS ESTRITAS DE JSON:
    1. Retorne APENAS JSON válido.
    2. NÃO use comentários (// ou /* */).
    3. NÃO use vírgulas finais (trailing commas).
    4. TODAS as chaves devem estar entre aspas duplas.

    Estrutura Obrigatória do JSON:
    {
      "ideas": [
        {
          "id": 1,
          "title": "Nome do Conceito (PT-BR)",
          "description": "Resumo (PT-BR)",
          "visualPrompts": ["Prompt Imagem 1 (PT-BR)", "Prompt Imagem 2", "Prompt Imagem 3"],
          "visualStrategy": {
             "colorPalette": ["#hex", "#hex"],
             "artStyle": "Estilo",
             "typographySuggestion": "Sugestão Fonte",
             "specificGuides": [
                {
                  "mainHeadline": "Texto Imagem 1 (PT-BR)",
                  "mainFont": "Nome da Fonte",
                  "secondaryText": "Subtexto",
                  "secondaryFont": "Fonte Secundária",
                  "visualElements": "Elementos",
                  "ctaButton": "Texto Botão",
                  "placementTips": "Dicas de posição",
                  "canvaPrompt": "Prompt detalhado para o Canva IA 2.0 (PT-BR)"
                },
                {}, {} 
             ]
          },
          "specificCopywriting": [
            {
               "socialCaptionHeadlines": ["Hook Variacao 1", "Hook Alt"],
               "caption": "Legenda adaptada para a cena da Imagem 1...",
               "hashtags": ["#tag1"],
               "hook": "Gancho 1",
               "body": "Corpo 1",
               "finalCta": "CTA 1"
            },
            { "caption": "Legenda para Imagem 2...", "hashtags": [], "socialCaptionHeadlines": [], "hook": "", "body": "", "finalCta": "" },
            { "caption": "Legenda para Imagem 3...", "hashtags": [], "socialCaptionHeadlines": [], "hook": "", "body": "", "finalCta": "" }
          ],
          "copywriting": {
             "socialCaptionHeadlines": ["Hook Genérico"],
             "caption": "Legenda genérica (fallback)",
             "hashtags": ["#tag"],
             "hook": "Gancho",
             "body": "Corpo",
             "finalCta": "CTA"
          },
          "videoJsonTemplate": {
            "_meta": {
              "type": "Product Commercial",
              "aspect_ratio": "16:9",
              "target_output": "Hyper-realistic video with localized audio"
            },
            "scene_elements": {
              "subject_details": "Detailed visual description of the product in ENGLISH.",
              "environment_context": "Background description in ENGLISH.",
              "visual_effects": "VFX description in ENGLISH."
            },
            "cinematography": {
              "camera_movement": "Camera move in ENGLISH.",
              "shot_type": "Shot type in ENGLISH.",
              "lighting_style": "Lighting in ENGLISH.",
              "art_style": "Style in ENGLISH."
            },
            "audio_production": {
              "voice_profile": {
                "gender": "Male",
                "tone": "Tone adjectives in ENGLISH.",
                "is_voiceover": true
              },
              "script_pt_br": "Roteiro falado em PORTUGUÊS."
            }
          }
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...parts,
          { text: "Gere a estratégia seguindo o JSON schema estrito. Certifique-se de criar 'specificCopywriting' para cada uma das 3 variações de imagem." }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const jsonString = cleanJsonString(response.text || "{}");
    const parsed = JSON.parse(jsonString);
    
    if (!parsed.ideas || !Array.isArray(parsed.ideas)) {
      throw new Error("JSON inválido: Falta array de 'ideas'");
    }
    
    return parsed as StrategyResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Falha ao gerar estratégia.");
  }
};

export const generateIdeaImage = async (
  prompt: string,
  originalImageBase64: string | null,
  mode: GenerationMode,
  refinement?: string,
  aspectRatio?: string
): Promise<string | null> => {
  const ai = getClient();
  let fullPrompt = "";

  if (refinement) {
     fullPrompt = `Baseado na imagem fornecida, realize estritamente este ajuste: "${refinement}". 
     IMPORTANTE: Mantenha a consistência visual, ângulo, iluminação e composição exatos da imagem original. 
     Apenas altere o que foi pedido. IMPORTANTE: NÃO INCLUA TEXTO, letras, números ou marcas d'água na imagem. A imagem deve ser visualmente limpa.`;
  } else {
     fullPrompt = `${prompt}. IMPORTANTE: NÃO INCLUA TEXTO, letras, números ou marcas d'água na imagem. A imagem deve ser visualmente limpa e focar no produto e cenário.`;
  }

  // Prepare content parts
  const parts: any[] = [{ text: fullPrompt }];
  
  // Only attach image if available and requested (Fidelity or Refinement)
  // If Text Mode initial generation (no originalImageBase64), we skip this.
  const shouldAttachImage = (originalImageBase64 && mode === GenerationMode.FIDELITY) || (originalImageBase64 && refinement);

  if (shouldAttachImage) {
      const base64Data = originalImageBase64!.split(',')[1];
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
      
      if (refinement) {
        parts.push({ text: "Edite esta imagem mantendo a consistência. Sem texto adicionado." });
      } else {
        parts.push({ text: "Preserve a aparência do produto. Sem adicionar texto." });
      }
  }

  // Helper to extract image from response
  const extractImage = (res: any) => {
    if (res.candidates && res.candidates[0].content.parts) {
      for (const part of res.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  };

  try {
    // ATTEMPT 1: Use 2.5 Flash Image (Priority)
    // This is the primary request from user.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1"
        }
      }
    });

    return extractImage(response);

  } catch (error: any) {
    const errStr = error.toString();
    console.warn("Primary Model (2.5) Failed:", errStr);

    // Fallback logic
    console.log("Falling back to gemini-3-pro-image-preview...");
      
    try {
      // ATTEMPT 2: Fallback to Pro model if 2.5 fails
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: {
            imageConfig: {
              aspectRatio: aspectRatio || "1:1"
            }
        }
      });

      return extractImage(fallbackResponse);

    } catch (fallbackError) {
      console.error("Fallback Generation Error:", fallbackError);
      return null;
    }
  }
};

/**
 * Applies text overlays to an image to create a final ad mockup
 */
export const applyTextOverlay = async (
  imageBase64: string,
  texts: {
    headline: string;
    subtitle: string;
    cta: string;
  },
  style: {
    font: string;
    colors: string[];
    placement: string;
  },
  aspectRatio?: string,
  canvaPrompt?: string
): Promise<string | null> => {
  const ai = getClient();
  
  let prompt = "";
  if (canvaPrompt) {
    prompt = `
      Você é um Designer Gráfico Sênior de nível mundial e Diretor Criativo Sênior especializado em campanhas publicitárias de alto padrão para Canva AI 2.0.
      Sua tarefa é finalizar esta imagem publicitária adicionando as camadas de texto de forma exuberante e criativa, a composição e a direção de arte de acordo com as diretrizes do briefing de alta performance fornecido abaixo.
      
      Mantenha o produto ou foco da imagem original intacto, mas complete, integre e refine toda a arte seguindo as diretrizes descritas no briefing.
      
      BRIEFING / PROMPT ESTRUTURADO CANVA AI 2.0 COMPLETO:
      """
      ${canvaPrompt}
      """
      
      IMPORTANTE:
      - Siga fielmente o Objetivo, Imagem Principal (como narrativa visual e seu posicionamento), Direção de Arte, Paleta de cores, Composição, Hierarquia Visual, Título (Headline), Subtítulo (Subheadline), CTA e os Ajustes Finais descritos acima.
      - O Título Principal (Headline) deve possuir um formato inovador, arrojado e de altíssimo impacto visual que chame a atenção imediata. Use contrastes incríveis, efeitos 3D refinados, letras interagindo com a cena (por exemplo: passando suavemente por trás de partes do produto ou poeira flutuante), degradês de cor marcantes da paleta, brilhos de neon soft ou texturas integradas. Diga não ao título simples com fonte padrão lisa e sem graça. O título deve ser o magneto da peça!
      - Integre perfeitamente o produto, fundo, texto, fontes estéticas e os efeitos de profundidade como sombras, glows ou partículas sem parecer uma colagem.
      - Evite caixas sólidas ou retângulos desconectados de preenchimento atrás do texto. Integre toda a arte como uma peça publicitária única e cinematográfica.
    `;
  } else {
    prompt = `
      Você é um Designer Gráfico Sênior e Diretor de Arte renomado.
      Sua tarefa é finalizar esta imagem publicitária adicionando camadas de texto (Tipografia) sobre a imagem fornecida de forma extremamente criativa e profissional.
 
      INSTRUÇÕES:
      1. Mantenha o fundo e o produto da imagem original intactos. Não altere a cena, apenas sobreponha o texto com alta maestria de design.
      2. Adicione os seguintes textos de forma ultra legível, inovadora e de alta performance:
         - Título Principal (Headline): "${texts.headline}"
         - Subtítulo: "${texts.subtitle}"
         - Botão CTA (Chamada para ação): "${texts.cta}"
      
      DIRETRIZ DE DESIGN PARA O TÍTULO PRINCIPAL (HEADLINE):
      - O Título Principal (Headline) deve ser adicionado com um formato extraordinariamente criativo, arrojado e chamativo, que capture a atenção instantânea do espectador.
      - Não adicione um texto plano e sem graça em preto ou branco simples. Utilize efeitos de relevo, degradês/gradientes fluidos de cores baseadas na paleta fornecida, sombras de projeção suaves com desfoque realista, brilhos ou retroiluminação néon soft nas bordas das letras, ou texturas coerentes com a proposta.
      - Se possível, integre as letras de forma tridimensional com a cena (ex: o produto principal sobreposto de leve nas bordas das letras para simular profundidade real de camadas).
      
      ESTILO VISUAL:
      - Tipografia/Fonte: Estilo "${style.font}".
      - Cores do Texto/Elementos: Use esta paleta: ${style.colors.join(", ")}.
      - Posicionamento: ${style.placement}.
      
      O resultado final deve parecer um anúncio premium de revista ou post de mídia social de grife pronto para publicar.
    `;
  }

  const parts = [
    { text: prompt },
    { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio || "1:1"
        }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Text Overlay Error:", error);
    throw new Error("Falha ao aplicar texto na imagem.");
  }
};

/**
 * Expands or refills an image based on a target layout (Outpainting)
 */
export const expandImageRatio = async (
  originalImageBase64: string,
  targetLayoutBase64: string
): Promise<string | null> => {
  const ai = getClient();
  const prompt = "Use the second image as a reference for the final proportions and fill in the area that was not shown in the original image. Do not include any text, letters or numbers in the generated area.";

  const parts = [
    { text: prompt },
    // First image: The content source
    { inlineData: { mimeType: 'image/jpeg', data: originalImageBase64.split(',')[1] } },
    // Second image: The target layout/aspect ratio reference
    { inlineData: { mimeType: 'image/png', data: targetLayoutBase64.split(',')[1] } }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Keeping 2.5 consistent as requested
      contents: { parts }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Expand Image Error:", error);
    throw new Error("Falha ao ajustar proporção da imagem.");
  }
};

export const generateStoryboard = async (
  baseImageBase64: string,
  sceneCount: number,
  conceptContext: string,
  videoSettings?: VideoJsonOutput,
  aspectRatio?: string
): Promise<Scene[]> => {
  const ai = getClient();
  const base64Data = baseImageBase64.split(',')[1];

  let styleContext = "";
  if (videoSettings) {
    styleContext = `
      DIRETRIZES ESTRITAS DE ESTILO (MANTENHA ISSO EM TODAS AS CENAS):
      - Estilo Artístico: ${videoSettings.cinematography?.art_style || "Realistic"}
      - Ambiente: ${videoSettings.scene_elements?.environment_context || "Consistent with base image"}
      - Efeitos Visuais (VFX): ${videoSettings.scene_elements?.visual_effects || "None"}
      - Iluminação: ${videoSettings.cinematography?.lighting_style || "Cinematic"}
    `;
  }

  const planSystemInstruction = `
    Você é um Roteirista e Diretor de Arte. Crie um storyboard visual de ${sceneCount} cenas baseado na imagem fornecida.
    
    ${styleContext}
    
    A narrativa deve ter consistência absoluta de estilo, produto e iluminação definidos acima.
    A última cena DEVE ser um CTA (Call to Action).
    
    IMPORTANTE: Nos 'visualPrompt', descreva apenas a cena. NÃO peça textos, letreiros ou tipografia na imagem.
    
    Retorne APENAS um JSON ARRAY estrito:
    [
      {
        "sequenceNumber": 1,
        "type": "INTRO",
        "description": "Descrição curta da ação e narrativa (PT-BR)",
        "visualPrompt": "Prompt visual detalhado em PT-BR para gerar esta imagem. Inclua explicitamente a descrição do estilo e ambiente definidos. SEM PEDIR TEXTO.",
        "videoJson": {
          "_meta": {
            "type": "Product Commercial",
            "aspect_ratio": "16:9",
            "target_output": "Hyper-realistic video with localized audio"
          },
          "scene_elements": {
            "subject_details": "Detailed visual description in ENGLISH.",
            "environment_context": "Background in ENGLISH.",
            "visual_effects": "VFX in ENGLISH."
          },
          "cinematography": {
            "camera_movement": "Camera move in ENGLISH.",
            "shot_type": "Shot type in ENGLISH.",
            "lighting_style": "Lighting in ENGLISH.",
            "art_style": "Style in ENGLISH."
          },
          "audio_production": {
            "voice_profile": {
              "gender": "Male",
              "tone": "Tone in ENGLISH.",
              "is_voiceover": true
            },
            "script_pt_br": "Roteiro em PORTUGUÊS."
          }
        }
      }
    ]
  `;

  let scenes: Scene[] = [];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: `Crie um storyboard de ${sceneCount} cenas para este produto. Contexto da Ideia: ${conceptContext}` }
        ]
      },
      config: { systemInstruction: planSystemInstruction }
    });

    const jsonString = cleanJsonString(response.text || "[]");
    const parsedPlan = JSON.parse(jsonString);
    
    const scenePromises = parsedPlan.map(async (sceneData: any) => {
      let generatedImageUrl = null;
      try {
        generatedImageUrl = await generateIdeaImage(
          `${sceneData.visualPrompt}. ${styleContext}`,
          baseImageBase64,
          GenerationMode.FIDELITY,
          undefined,
          aspectRatio // Propagate aspect ratio to scene generation
        );
      } catch (e) {
        console.error(`Falha na imagem da cena ${sceneData.sequenceNumber}`, e);
      }

      return {
        id: Date.now() + Math.random().toString(),
        sequenceNumber: sceneData.sequenceNumber,
        type: sceneData.type,
        description: sceneData.description,
        visualPrompt: sceneData.visualPrompt,
        imageUrl: generatedImageUrl,
        videoJson: sceneData.videoJson
      } as Scene;
    });

    scenes = await Promise.all(scenePromises);
    return scenes.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  } catch (error) {
    console.error("Storyboard Error:", error);
    throw new Error("Falha ao gerar storyboard.");
  }
};

export const evaluateArtwork = async (
  originalImageBase64: string | null,
  userArtBase64: string,
  ideaContext: string
): Promise<MentorshipResult> => {
  const ai = getClient();
  const systemInstruction = `
    Como um mentor de design experiente, analise a arte do usuário comparando com o guia estratégico e conceito do post: "${ideaContext}".
    Se uma imagem original de produto de referência for fornecida, compare como ela foi integrada.
    Forneça uma avaliação direta, honesta e construtiva em Português.
    
    Retorne estritamente um objeto JSON com as seguintes chaves:
    { "score": 0-10, "feedback": "Análise focada nas melhorias, alinhamento visual, fontes, cores e composição do post final", "comparison": "Curta comparação de fidelidade visual ou contextual" }
  `;

  try {
    const userArtData = userArtBase64.split(',')[1];
    const parts: any[] = [];

    if (originalImageBase64) {
      try {
        const originalData = originalImageBase64.split(',')[1];
        parts.push({ text: "Original Reference Image:" });
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: originalData } });
      } catch (e) {
        console.error("Error parsing original image, continuing without it:", e);
      }
    }

    parts.push({ text: `Target Concept & Copy guidelines: ${ideaContext}` });
    parts.push({ text: "User Artwork to assess:" });
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: userArtData } });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: parts
      },
      config: { 
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const jsonString = cleanJsonString(response.text || "{}");
    return JSON.parse(jsonString) as MentorshipResult;
  } catch (error) {
    console.error("Mentorship Error:", error);
    throw new Error("Falha na avaliação.");
  }
};

export const generateVeoVideo = async (
  prompt: string,
  imageBase64: string | null
): Promise<string> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey && win.aistudio.openSelectKey) {
       await win.aistudio.openSelectKey();
    }
  }

  const ai = getClient();
  const model = 'veo-3.1-fast-generate-preview';
  const base64Data = imageBase64 ? imageBase64.split(',')[1] : null;

  try {
    let operation;
    const config = { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' };
    
    if (base64Data) {
      operation = await ai.models.generateVideos({
        model,
        prompt,
        image: { imageBytes: base64Data, mimeType: 'image/jpeg' },
        config
      });
    } else {
      operation = await ai.models.generateVideos({ model, prompt, config });
    }

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("URI vazia.");
    return `${videoUri}&key=${process.env.API_KEY}`;
    
  } catch (error: any) {
    console.error("Veo Error:", error);
    if (JSON.stringify(error).includes("Requested entity was not found") || error.message?.includes("Requested entity was not found")) {
        const win = window as any;
        if (win.aistudio && win.aistudio.openSelectKey) {
          await win.aistudio.openSelectKey();
          throw new Error("Sessão expirada. Selecione a chave novamente e tente mais uma vez.");
        }
    }
    throw error;
  }
};

/**
 * Generates a high-performance Canva IA 2.0 prompt for a single variation
 */
export const generateSingleCanvaPrompt = async (
  ideaTitle: string,
  ideaDescription: string,
  guide: {
    mainHeadline: string;
    mainFont: string;
    secondaryText: string;
    secondaryFont: string;
    visualElements: string;
    ctaButton: string;
    placementTips: string;
  },
  colorPalette: string[],
  typographySuggestion: string,
  aspectRatio?: string
): Promise<string> => {
  const ai = getClient();
  const formatName = aspectRatio === '9:16' ? 'Story (9:16)' : (aspectRatio === '16:9' ? 'Widescreen (16:9)' : 'Quadrado (1:1)');
  
  const systemInstruction = `
    Você é um Diretor de Criação de Elite, Diretor Fotográfico e Engenheiro de Prompt de escala mundial especializado em campanhas publicitárias de alto padrão para o Canva AI 2.0.
    Sua tarefa é criar um PROMPT PRINCIPAL CINEMATOGRÁFICO PUBLICITÁRIO PREMIUM estruturado pronto para gerar artes de altíssimo impacto e fusão estética.
    
    O prompt gerado deve ser extremamente detalhado, cinematográfico, fisicamente plausível, coerente e com apelo estético marcante. Evite qualquer tipo de overprompting ou competição visual de efeitos exagerados.
    O prompt gerado deve seguir RIGOROSA e FIELMENTE a estrutura de 12 seções estruturadas descritas abaixo, preenchendo cada uma de forma rica, técnica e sem adjetivos subjetivos vagos:

    # REGRAS DE OURO DE ENGENHARIA DE PROMPT PREMIUM:
    1. REDUZIR REDUNDÂNCIA SEMÂNTICA: Evite listar múltiplos adjetivos emocionais sinônimos. Condense a direção emocional em conceitos diretos de impacto (ex: "elite athletic energy with explosive forward momentum" ou "minimalist luxury elegance with supreme calm").
    2. INSTRUÇÕES VISUAIS CONCRETAS (FÍSICA DA CENA): Nunca use abstrações vazias como "evitar amadorismo", "priorizar conversão", "causar impacto psicológico". A IA de imagem entende física de cena, comportamento óptico e propriedades reais da luz. Use terminologias concretas: "high-contrast focal hierarchy", "cohesive cinematic lighting", "premium commercial composition", "natural atmospheric integration", "depth-of-field control", "realistic material response", "high dynamic range lighting".
    3. CONTROLE DE DENSIDADE (EVITAR OVERPROMPTING): Quanto maior for o produto protagonista na composição central, menor deve ser a densidade de efeitos desnecessários (partículas, partículas volumétricas, flares, fumaça) para priorizar clareza, foco absoluto, e excelente legibilidade das mensagens do post.
    4. EVITAR MICROGERENCIAMENTO TIPOGRÁFICO EXCESSIVO: Não deforma ou sobrecarregue tipografias com exagerados gradientes 3D concorrentes ou detalhes impossíveis simultâneos. Descreva-a por força estética, peso de destaque e fusão física no ambiente (ex: "bold modern display typography featuring subtle backlight glow and natural physical occlusion behind the hero product").
    5. DETALHAMENTO CINEMATOGRÁFICO DE FOTOGRAFIA: Utilize especificações de lentes reais e propriedades físicas para que a IA processe a composição como um frame de estúdio profissional real, tais como: "shot with an 85mm lens", "soft atmospheric haze", "cinematic rim lighting", "shallow depth of field", "volumetric dramatic light beams".

    # ESTRUTURA DO PROMPT GERADO (Preencha exatamente as 12 seções abaixo com informações ricas e completas em Português)

    # 1. CONCEITO CENTRAL
    Deixe claro que se trata da criação de um Post ou Layout Publicitário profissional de altíssima conversão de redes sociais para a proporção/formato exato "${formatName}". Defina a emoção e a intenção de conversão condensada e objetiva (ex: frescor gastronômico intenso, luxo minimalista, velocidade esportiva).

    # 2. HERO SHOT (CENA PRINCIPAL)
    Esta seção do prompt gerado deve conter EXCLUSIVAMENTE duas ou três linhas de especificidade técnica e narrativa:
    - Orientação: Utilizar a imagem anexa selecionada para a geração publicitária de alto padrão.
    - Formato: ${formatName}
    - Descrição da Imagem de Referência: Descrição curta do produto/cena na imagem anexa de referência, detalhando sua narrativa física real ("${guide.visualElements}").

    # 3. DIREÇÃO DE ARTE
    Definição da linguagem estética baseada em grifes de alto padrão. Misture referências como: publicidade cinematográfica premium, luxury commercial, anúncios da Apple, Nike, Netflix, Food Porn de altíssimo detalhe, Hyper-realism ou minimalismo refinado.

    # 4. ILUMINAÇÃO CINEMATOGRÁFICA
    Design de iluminação de elite física: luz principal de estúdio, "cinematic rim lighting" para definição tridimensional sutil das bordas, luz volumétrica de-focus no fundo e sombras naturais controlando o foco visual de forma espetacular.

    # 5. COMPOSIÇÃO
    Composição de blockbuster de anúncio global: proporção de layout exata para redes sociais nas dimensões de "${formatName}", enquadramento fotográfico de 85mm, "shallow depth of field" que isola o elemento principal de forma premium, safe areas estruturais de 15% e hierarquia visual imponente. Deve ser extremamente explícito para manter e usar a imagem de referência fornecida pelo usuário como a base mecânica e de contexto real e inalterável do produto, aplicando refinamentos de iluminação e atmosfera descritos apenas para elevar a qualidade estética da cena, proibindo terminantemente qualquer alucinação visual que altere o design, formato ou contexto original do produto de referência.

    # 6. FUNDO E ATMOSFERA
    Plano de fundo refinado: poeira de partícula flutuando sutilmente, névoa ultra soft de profundidade ("soft atmospheric haze"), vapor para produtos quentes ou texturas de estúdio finas que apoiam o produto protagonista sem competir ou causar poluição visual.

    # 7. TEXTURAS E MICRO DETALHES
    Hiper detalhamento real de materiais e superfícies ("realistic material response"): brilho suave de lente de câmera, micro texturas táteis (metal escovado, vidro translúcido, madeira, pele), gotículas realistas de frescor condensadas sem distorcer formas ou proporções.

    # 8. PALETA DE CORES
    Definição cromática harmônica utilizando a paleta sugerida (${colorPalette.join(", ")}). Saturação calibrada de fotografia premium que cria conexão fluida e uma estética perfeitamente coesa entre fundo, produto e tipografias.

    # 9. TIPOGRAFIA (SE NECESSÁRIO)
    Fusão física da tipografia baseada na Headline de altíssimo impacto ("${guide.mainHeadline}"), subtítulo complementar ("${guide.secondaryText}") e botão de CTA ("${guide.ctaButton}").
    Diretriz física para o Título Principal: Design arrojado e de altíssimo contraste visual interdefinido no espaço (ex: "bold typography style using ${guide.mainFont || typographySuggestion} integrated into layout depth with soft backlight drop shadow and physical occlusion behind the hero item"). Livre de caixas de texto sólidas chapadas.

    # 10. EFEITOS CINEMATOGRÁFICOS
    Efeitos cinematográficos realistas integradores: "motion freeze" do instante mais expressivo do movimento físico, bloom sutil, fumaça soft realista, "high dynamic range" de estúdio e reflexos plausíveis de estúdio de fotografia.

    # 11. QUALIDADE FINAL
    Termos de qualidade extrema que forcem a IA do Canva a atingir perfeição: "hyper realistic, cinematic advertising, ultra detailed, 8K, masterpiece, luxury commercial look, award-winning advertising, studio quality, viral social media aesthetics, emotional visual impact, premium color grading."

    # 12. BLOCO DE NEGATIVOS
    Sempre adicione no final restrições explícitas contra amadorismo e problemas do Canva: "Evitar: low quality, blurry, flat lighting, bad anatomy, cheap CGI look, oversaturated colors, artificial textures, visual pollution, amateur composition, generic advertising look, distorted elements, unrealistic proportions, solid colored text box overlays."

    Sua resposta deve conter UNICAMENTE o prompt final estruturado de alta fidelidade em Português (PT-BR) com as doze (12) seções acima. Não adicione qualquer palavra de introdução ou saudação. Retorne direto o prompt.
  `;

  const userPrompt = `
    Crie o prompt estruturado para o Canva IA 2.0 com base nas seguintes especificações de conteúdo e estilo:
    
    - Título da Ideia: "${ideaTitle}"
    - Descrição da Ideia: "${ideaDescription}"
    - Título/Texto Principal do Guia: "${guide.mainHeadline}"
    - Fonte Principal: "${guide.mainFont || typographySuggestion}"
    - Subtítulo: "${guide.secondaryText}"
    - Fonte Secundária: "${guide.secondaryFont}"
    - Elementos Visuais (Breve descrição para Imagem Principal): "${guide.visualElements}"
    - CTA: "${guide.ctaButton}"
    - Dicas de Posicionamento: "${guide.placementTips}"
    - Paleta de Cores: ${colorPalette.join(", ")}
    - Sugestão de Tipografia Geral: "${typographySuggestion}"
    - Formato do Layout: "${formatName}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { text: userPrompt },
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text?.trim() || "Falha ao gerar o prompt estruturado.";
  } catch (error) {
    console.error("Error generating single Canva prompt:", error);
    throw new Error("Não foi possível gerar o prompt para o Canva IA 2.0.");
  }
};
