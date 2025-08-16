const express = require('express');
const cors = require('cors');
const app = express();

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
    service: 'ConversationAssistant API - Local Test',
    version: '1.0.0'
  });
});

// GPT-5-mini conversation generation endpoint
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
    
    // 3つの異なるメッセージパターンを生成
    const casualMessages = [
      `こんにちは、${partnerName}さん！${userAge}歳の${firstPerson}です😊 ${partnerName}さんの趣味の「${partnerInterests}」って面白そうですね！`,
      `お疲れさまです！今日はどんな一日でしたか？${firstPerson}の趣味は${userInterests}なんです♪`,
      `こんばんは！${partnerName}さんとお話しできて嬉しいです✨ 何か楽しいことありましたか？`
    ];
    
    const politeMessages = [
      `こんにちは、${partnerName}さん。${userAge}歳の${firstPerson}と申します。${partnerName}さんのご趣味である「${partnerInterests}」について、お聞かせいただけますでしょうか。`,
      `お疲れさまでございます。本日はいかがお過ごしでしたでしょうか。${firstPerson}の趣味は${userInterests}でございます。`,
      `こんばんは、${partnerName}さん。お話しできて光栄です。何かご興味深いことはございましたでしょうか。`
    ];
    
    const messageTemplates = tone === 'casual' ? casualMessages : politeMessages;
    
    const suggestions = messageTemplates.map((content, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      content: content,
      tone: tone
    }));

    console.log('✅ Generated 3 suggestions:', suggestions);

    res.json({ 
      suggestions: suggestions,
      model: 'local-test-server'
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
  console.log(`🚀 Local Test Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Generate endpoint: http://localhost:${PORT}/api/generate-message`);
});