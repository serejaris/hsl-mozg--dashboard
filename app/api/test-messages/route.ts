import { NextResponse } from 'next/server';
import { 
  createMessageHistory, 
  addMessageRecipients, 
  updateRecipientStatus, 
  updateMessageDeliveryStats,
  getMessageHistory,
  getMessageRecipients,
  TelegramUser 
} from '@/lib/queries';

export async function POST() {
  try {
    console.log('🧪 Testing message-related database functions...');

    // Test 1: Create a message history entry
    console.log('1️⃣ Testing createMessageHistory...');
    const messageId = await createMessageHistory('Test broadcast message for database testing', 2);
    console.log(`✅ Created message with ID: ${messageId}`);

    // Test 2: Add message recipients
    console.log('2️⃣ Testing addMessageRecipients...');
    const testUsers: TelegramUser[] = [
      { user_id: 12345, username: 'test_user_1', first_name: 'Test User 1' },
      { user_id: 67890, username: 'test_user_2', first_name: 'Test User 2' }
    ];
    await addMessageRecipients(messageId, testUsers);
    console.log('✅ Added message recipients');

    // Test 3: Update recipient status
    console.log('3️⃣ Testing updateRecipientStatus...');
    await updateRecipientStatus(messageId, 12345, 'sent');
    await updateRecipientStatus(messageId, 67890, 'failed');
    console.log('✅ Updated recipient statuses');

    // Test 4: Update message delivery stats
    console.log('4️⃣ Testing updateMessageDeliveryStats...');
    await updateMessageDeliveryStats(messageId);
    console.log('✅ Updated message delivery stats');

    // Test 5: Get message history
    console.log('5️⃣ Testing getMessageHistory...');
    const messageHistory = await getMessageHistory(10, 0);
    console.log(`✅ Retrieved ${messageHistory.length} message history entries`);

    // Test 6: Get message recipients
    console.log('6️⃣ Testing getMessageRecipients...');
    const messageRecipients = await getMessageRecipients(messageId);
    console.log(`✅ Retrieved ${messageRecipients.length} message recipients`);

    return NextResponse.json({
      success: true,
      message: 'All message database functions tested successfully!',
      testResults: {
        messageId: messageId,
        messageHistoryCount: messageHistory.length,
        messageRecipientsCount: messageRecipients.length,
        messageHistory: messageHistory[0], // Latest entry
        messageRecipients: messageRecipients
      }
    });

  } catch (error) {
    console.error('❌ Message database test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown test error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}