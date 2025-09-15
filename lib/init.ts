// Application initialization - starts background services
import { getMessageScheduler } from './messageScheduler';

let isInitialized = false;
let initAttempts = 0;

export function initializeApp(): void {
  initAttempts++;
  console.log(`🔄 Initialization attempt #${initAttempts}`);
  
  if (isInitialized) {
    console.log(`⚠️ App already initialized, skipping attempt #${initAttempts}`);
    return;
  }

  console.log('🚀 Initializing HSL Dashboard application...');

  try {
    // Start message scheduler
    const scheduler = getMessageScheduler();
    scheduler.start();
    
    console.log('✅ Application initialization completed');
    isInitialized = true;
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
  }
}

// Auto-initialize when this module is imported (for server-side)
if (typeof window === 'undefined') {
  initializeApp();
}