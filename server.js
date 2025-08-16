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
    
    // 豊富なバリエーションのメッセージプール（毎回異なるメッセージを生成）
    const casualMessages = [
      `こんにちは、${partnerName}さん！${userAge}歳の${firstPerson}です😊 ${partnerName}さんの趣味の「${partnerInterests}」って面白そうですね！`,
      `お疲れさまです！今日はどんな一日でしたか？${firstPerson}の趣味は${userInterests}なんです♪`,
      `こんばんは！${partnerName}さんとお話しできて嬉しいです✨ 何か楽しいことありましたか？`,
      `初めまして、${partnerName}さん！${firstPerson}は${userAge}歳です🙂 ${partnerInterests}って素敵な趣味ですね！`,
      `こんにちは〜！${firstPerson}、${userInterests}が好きなんです😄 ${partnerName}さんはどんな${partnerInterests}をされるんですか？`,
      `お疲れさま！${partnerName}さんって${partnerInterests}がお好きなんですね✨ 今度教えてください！`,
      `はじめまして！${userAge}歳の${firstPerson}です😊 ${partnerName}さんとお話しできて楽しいです！`,
      `こんにちは！${firstPerson}は${userInterests}が趣味なんです🎵 ${partnerName}さんの${partnerInterests}のお話も聞きたいです！`,
      `お疲れさまでした！${partnerName}さん、今日はどんな${partnerInterests}の時間を過ごされましたか？`,
      `こんばんは〜！${firstPerson}、${partnerName}さんとおしゃべりできて嬉しいです😊 最近${partnerInterests}はいかがですか？`,
      `やっほー！${partnerName}さん😃 ${firstPerson}の趣味は${userInterests}なんですが、${partnerInterests}も楽しそう！`,
      `おはようございます！${partnerName}さん☀️ ${userAge}歳の${firstPerson}です。${partnerInterests}って奥が深そうですね！`
    ];
    
    const politeMessages = [
      `こんにちは、${partnerName}さん。${userAge}歳の${firstPerson}と申します。${partnerName}さんのご趣味である「${partnerInterests}」について、お聞かせいただけますでしょうか。`,
      `お疲れさまでございます。本日はいかがお過ごしでしたでしょうか。${firstPerson}の趣味は${userInterests}でございます。`,
      `こんばんは、${partnerName}さん。お話しできて光栄です。何かご興味深いことはございましたでしょうか。`,
      `初めてお話しさせていただきます、${partnerName}さん。${userAge}歳の${firstPerson}と申します。${partnerInterests}というご趣味をお持ちとのことですが、とても興味深いですね。`,
      `こんにちは、${partnerName}さん。${firstPerson}の趣味は${userInterests}でございまして、${partnerName}さんの${partnerInterests}についてもぜひお聞かせいただけたらと思います。`,
      `お疲れさまでございます、${partnerName}さん。本日も${partnerInterests}のお時間を楽しまれましたでしょうか。`,
      `はじめまして、${partnerName}さん。${firstPerson}と申します。${partnerName}さんとお話しできることを嬉しく思っております。`,
      `こんにちは、${partnerName}さん。${firstPerson}は${userInterests}に関心を持っておりまして、${partnerName}さんの${partnerInterests}についてもお教えいただけますでしょうか。`,
      `お疲れさまでございました、${partnerName}さん。今日は充実した${partnerInterests}の時間をお過ごしになれましたでしょうか。`,
      `こんばんは、${partnerName}さん。お話しの機会をいただき、ありがとうございます。最近の${partnerInterests}はいかがでいらっしゃいますか。`,
      `おはようございます、${partnerName}さん。${firstPerson}、${userAge}歳と申します。${partnerInterests}という素晴らしいご趣味をお持ちですね。`,
      `お疲れ様でございます。${partnerName}さんの${partnerInterests}について詳しくお聞かせいただけると幸いです。${firstPerson}も${userInterests}に興味があります。`
    ];
    
    const messagePool = tone === 'casual' ? casualMessages : politeMessages;
    
    // ランダムに3つ選択（重複なし）
    const shuffled = [...messagePool].sort(() => Math.random() - 0.5);
    const selectedMessages = shuffled.slice(0, 3);
    
    // より動的なメッセージ生成（文脈を考慮）
    const timeOfDay = new Date().getHours();
    const greeting = timeOfDay < 12 ? 'おはよう' : timeOfDay < 18 ? 'こんにちは' : 'こんばんは';
    
    // 会話履歴に基づく文脈の判定
    const hasMessages = messages && messages.length > 0;
    const isFirstContact = !hasMessages;
    
    // 動的メッセージを追加生成
    const dynamicMessages = [];
    
    if (isFirstContact) {
      dynamicMessages.push(
        `${greeting}！${partnerName}さん、${firstPerson}は${userAge}歳です。${partnerInterests}について教えてもらえませんか？`,
        `${partnerName}さん、初めまして！${firstPerson}の趣味は${userInterests}です。よろしくお願いします！`,
        `${greeting}、${partnerName}さん！${partnerInterests}がご趣味なんですね。興味深いです！`
      );
    } else {
      dynamicMessages.push(
        `${partnerName}さん、${partnerInterests}の調子はいかがですか？${firstPerson}は${userInterests}を楽しんでいます。`,
        `最近${partnerInterests}で何か新しい発見はありましたか？${firstPerson}も${userInterests}で面白いことがありました。`,
        `${partnerName}さんの${partnerInterests}のお話、もっと聞かせてください。`
      );
    }
    
    // 全メッセージプールを結合
    const allMessages = [...selectedMessages, ...dynamicMessages];
    
    // 最終的にランダムに3つ選択
    const finalShuffled = [...allMessages].sort(() => Math.random() - 0.5);
    const finalSelected = finalShuffled.slice(0, 3);
    
    const suggestions = finalSelected.map((content) => ({
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