const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const app = express();

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'ConversationAssistant API - GPT-4o-mini LLM',
    version: '1.0.0'
  });
});

// GPT-4o-mini conversation generation endpoint
app.post('/api/generate-message', async (req, res) => {
  try {
    console.log('📨 Generate message request:', req.body);
    
    const { userProfile, partnerInfo, messages, toneDialValue, messageType } = req.body;
    
    // Build conversation context
    const userAge = userProfile?.age || 20;
    const userGender = userProfile?.gender?.displayName || '不明';
    const userInterests = userProfile?.interests?.join('、') || '特になし';
    const firstPerson = req.body.firstPerson || '私';
    
    const partnerName = partnerInfo?.name || '相手';
    const partnerAge = partnerInfo?.age || '不明';
    const partnerInterests = partnerInfo?.interests?.join('、') || '特になし';
    const characterCount = req.body.characterCount || 60;
    
    // Determine tone
    let tone = toneDialValue <= 0.5 ? 'casual' : 'polite';
    
    // Build conversation history
    let conversationHistory = '';
    if (messages && messages.length > 0) {
      conversationHistory = messages.map(msg => 
        `${msg.sender === 'user' ? firstPerson : partnerName}: ${msg.content}`
      ).join('\n');
    }
    
    // Create system prompt for Japanese conversation
    const systemPrompt = `あなたは日本語の会話アシスタントです。以下の設定で自然な返信や話しかけを3つ生成してください。

ユーザー情報:
- 年齢: ${userAge}歳
- 性別: ${userGender}
- 興味: ${userInterests}
- 一人称: ${firstPerson}

相手の情報:
- 名前: ${partnerName}
- 年齢: ${partnerAge}歳
- 興味: ${partnerInterests}

要求:
- ${characterCount}文字以内で簡潔に
- ${tone === 'casual' ? 'カジュアル' : '丁寧'}なトーンで
- 自然で親しみやすい日本語
- メッセージタイプ: ${messageType}
- 毎回異なる内容で、創造的で魅力的なメッセージを生成
- 相手の興味や年齢を考慮した話題を含める

${conversationHistory ? `会話履歴:\n${conversationHistory}\n\n上記の会話に対する返信を生成してください。` : '会話を開始するメッセージを生成してください。'}

3つの異なるメッセージパターンを番号付きで生成してください。`;

    console.log('🤖 Calling GPT-4o-mini...');

    // Call OpenAI GPT-4o-mini API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '3つの異なるメッセージパターンを番号付きで生成してください。' }
      ],
      max_tokens: 500,
      temperature: 0.8,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });

    const responseText = completion.choices[0]?.message?.content || '';
    console.log('🤖 GPT-4o-mini response:', responseText);
    
    // Parse response and extract messages
    let suggestions = responseText.split('\n')
      .filter(line => line.trim() && /^[1-3]/.test(line.trim()))
      .slice(0, 3)
      .map(line => ({
        id: Math.random().toString(36).substr(2, 9),
        content: line.replace(/^[1-3][.\-\)]\s*/, '').trim(),
        tone: tone
      }));

    // Fallback if parsing fails
    if (suggestions.length < 3) {
      const fallbackMessages = tone === 'casual' ? [
        `こんにちは、${partnerName}さん！${userAge}歳の${firstPerson}です😊`,
        `お疲れさまです！${firstPerson}の趣味は${userInterests}なんです♪`,
        `${partnerName}さん、${partnerInterests}について教えてくださいね！`
      ] : [
        `こんにちは、${partnerName}さん。${userAge}歳の${firstPerson}と申します。`,
        `お疲れさまでございます。${firstPerson}の趣味は${userInterests}でございます。`,
        `${partnerName}さんの${partnerInterests}について、お聞かせいただけますでしょうか。`
      ];
      
      while (suggestions.length < 3) {
        suggestions.push({
          id: Math.random().toString(36).substr(2, 9),
          content: fallbackMessages[suggestions.length] || fallbackMessages[0],
          tone: tone
        });
      }
    }

    console.log('✅ Generated 3 suggestions:', suggestions);

    res.json({ 
      suggestions: suggestions,
      model: 'gpt-4o-mini-llm'
    });

  } catch (error) {
    console.error('🚨 Error generating message:', error);
    res.status(500).json({ 
      error: { 
        message: 'メッセージ生成に失敗しました',
        details: error.message 
      } 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GPT-4o-mini LLM Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Generate endpoint: http://localhost:${PORT}/api/generate-message`);
});